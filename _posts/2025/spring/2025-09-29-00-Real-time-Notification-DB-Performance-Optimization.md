---
title: "[Spring] 실시간 알림 DB 부하 개선 사례 (80% 감소)"
layout: single
author_profile: true
comments: true
share: true
related: true
date: '2025-09-29'
tags:
    - Spring
    - Database
    - Performance
    - Query Tuning
    - Caching
category: Performance
timezone: Asia/Seoul
---

# 0. 들어가며
이번 사례는 실제로는 **NestJS 기반 프로젝트**에서 발생한 문제이다. 다만 포스팅에서는 내가 부족하다고 느끼는 **Spring 실전 사례 인사이트를 보강**하기 위해, 시나리오와 예시 코드를 **Java/Spring** 환경으로 재구성했다. 아키텍처적 아이디어와 개선 방식 자체는 프레임워크와 무관하게 동일하게 적용 가능하다.

실시간 알림 기능은 사용자 경험을 높이는 핵심 요소이다. 그러나 잘못된 구현은 DB 부하를 유발하고 전체 시스템 안정성을 떨어뜨린다. 이번 글에서는 실시간 알림 기능으로 인해 발생한 DB 부하 문제를 어떻게 진단하고, 캐싱과 쿼리 최적화를 통해 80% 이상 줄였는지 과정을 공유한다.

# 1. 문제 현상
- 기능: WebSocket 기반 실시간 알림 전송
- 증상: 접속자가 몰리는 시간대에 DB CPU 사용률이 80~90%까지 급상승
- 코드 위치(예시): `NotificationPushScheduler.java`

# 2. 원인 분석
## 원인 1. 과도한 DB 폴링
```java
// NotificationPushScheduler.java (개선 전)
@Scheduled(fixedRate = 1000)
public void push() {
    for (OnlineUser u : onlineUserService.getOnlineUsers()) {
        List<UserNotificationDto> list = notificationService.getUserNotifications(u.getUserId());
        messagingTemplate.convertAndSendToUser(
                u.getSessionId(), "/queue/notifications", list);
    }
}
```
모든 구독자마다 매초 DB 조회를 수행 → DB에 과도한 부하 발생.

## 원인 2. N+1 쿼리
```java
// NotificationService.java (개선 전)
public List<UserNotificationDto> getUserNotifications(Long userId) {
    List<Notification> notis = notificationRepository.findByUser(userId);
    List<UserNotificationDto> result = new ArrayList<>();
    for (Notification n : notis) {
        Wallet w = walletRepository.findByAddress(n.getAddress()).orElse(null); // N+1 쿼리 발생
        result.add(UserNotificationDto.of(n, w));
    }
    return result;
}
```
알림 10개 조회 시 메인 쿼리 1회 + 추가 쿼리 10회 → 전형적인 N+1 문제.

## 원인 3. 비효율적인 SQL
```sql
-- NotificationRepository (개선 전)
SELECT *
FROM user_notifications t
WHERE COALESCE(t.chain_id, 0) = :chainId
ORDER BY t.updated_at DESC;

```
COALESCE 사용으로 인덱스가 무력화 → 풀 스캔 발생.

### EXPLAIN (개선 전)

| id | table | type | key | rows | Extra |
|----|-------|------|-----|------|-------|
| 1  | t     | ALL  | NULL| 102000 | Using filesort |

- **type=ALL**: 인덱스를 전혀 사용하지 않고 풀 스캔을 수행
- **rows=102000**: 전체 레코드 탐색 -> 데이터량이 많을수록 선형적으로 증가
- **Extra=Using filesort**: ORDER BY를 메모리/디스크 정렬로 처리 -> CPU 사용량 급증

# 3. 개선 방안
## 해결책 1. 캐싱 도입

Spring `@Cacheable` 자체에는 TTL 설정이 없고, CacheManager 설정에서 제어한다.
```java
@Configuration
@EnableCaching
public class CacheConfig {

    @Bean
    public CacheManager cacheManager() {
        return new CaffeineCacheManager("userNotifications") {
            {
                setCaffeine(Caffeine.newBuilder()
                    .expireAfterWrite(3, TimeUnit.SECONDS) // TTL 3초
                    .maximumSize(10000));
            }
        };
    }
}
```

```java
// NotificationService.java (개선 후)
@Cacheable(cacheNames = "userNotifications", key = "#userId")
public List<UserNotificationDto> getUserNotifications(Long userId) {
    List<Notification> notis = notificationRepository.findTopNByUserId(userId, 50);
    List<String> addresses = notis.stream().map(Notification::getAddress).toList();

    Map<String, Wallet> walletMap = walletRepository.findByAddressIn(addresses).stream()
            .collect(Collectors.toMap(Wallet::getAddress, Function.identity()));

    return notis.stream()
            .map(n -> UserNotificationDto.of(n, walletMap.get(n.getAddress())))
            .toList();
}
```
- Cache-Aside 전략 적용 → TTL 3초 설정으로 DB 조회 빈도를 줄임.


### Cache-Aside 전략
- 애플리케이션이 데이터를 조회할 때 **캐시 -> DB** 순서로 접근
- 캐시에 데이터가 있으면 즉시 반환 (Cache Hit)
- 캐시에 데이터가 없으면 DB 조회 후 캐시에 적재 (Cache Miss) 
- TTL(3초)을 짧게 두어 최신성을 유지하면서도 DB 조회 빈도를 크게 줄임
    - 1초마다 DB 조회가 발생하던 것을 3초마다 1회로 감소 → DB 부하 66% 감소

## 해결책 2. N+1 제거
```java
// 개선 전
for (Notification n : notis) {
    Wallet w = walletRepository.findByAddress(n.getAddress()).orElse(null); // N+1 발생
    result.add(UserNotificationDto.of(n, w));
}
```
```java
// 개선 후
List<String> addresses = notis.stream().map(Notification::getAddress).toList();
Map<String, Wallet> walletMap = walletRepository.findByAddressIn(addresses).stream()
        .collect(Collectors.toMap(Wallet::getAddress, Function.identity()));

return notis.stream()
        .map(n -> UserNotificationDto.of(n, walletMap.get(n.getAddress())))
        .toList();
```

### 효과
- 기존: 알림 10개 조회 시 메인 쿼리 1회 + 추가 쿼리 10회 (총 11회)
- 개선: 알림 10개 조회 시 메인 쿼리 1회 + 추가 쿼리 1회 (총 2회)
- 반복 쿼리 제거로 DB 조회 횟수를 크게 줄여 성능 향상
- N+1 문제 완전 제거, 쿼리 횟수 80% 감소.

## 해결책 3. SQL 튜닝 및 인덱스 최적화
```sql
-- NotificationRepository (개선 후)
SELECT *
FROM user_notifications t
WHERE (t.chain_id = :chainId OR t.chain_id IS NULL)
  AND t.user_id = :userId
ORDER BY t.updated_at DESC, t.id DESC
LIMIT 50;
```
```sql
-- 인덱스 추가
CREATE INDEX idx_user_updated_id
ON user_notifications (user_id, updated_at DESC, id DESC);
```
### EXPLAIN (개선 후)

| id | table | type | key | rows | Extra |
|---|---|---|---|---|---|
| 1 | t | ref | idx_user_updated_id | 120 | Using where; Using index; Limit |

- **type=ref**: 인덱스 조건을 활용한 부분 범위 스캔
- **rows=120**: 인덱스 기반 탐색으로 스캔 범위가 크게 줄어듦
- **Extra=Using where; Using index; Limit**: WHERE 조건과 ORDER BY 모두 인덱스로 처리되어 추가 정렬 불필요
- 풀 스캔 제거, 인덱스 기반 조회로 성능 개선.
    - 정렬(filesort) 제거 -> CPU 사용량 대폭 감소
    - 대량 사용자 동시 접속 시에도 안정적인 응답 가능

# 4. 개선 결과
- DB CPU 사용률: 80~90% → 10~15% (약 80% 감소)
- 알림 전송 지연 시간: 평균 300ms → 50ms (약 83% 감소)
- 시스템 안정성 향상, 사용자 경험 개선

# 5. 마치며
실시간 알림 기능은 사용자 경험을 크게 높여주지만, 구현 방식에 따라 시스템 전체에 치명적인 부담을 줄 수 있다는 점을 이번 사례를 통해 확인할 수 있었다. 특히,

- 단순히 "실시간성"만을 추구하면 불필요하게 짧은 주기로 DB를 압박하게 되고,
- N+1 문제나 인덱스 미활용 같은 기본적인 쿼리 비효율이 겹치면 서비스 안정성을 해칠 수 있다.

이번 개선에서 얻은 교훈은 완전한 실시간성보다 **"지속 가능한 준실시간 구조"**가 중요하다는 것이다. 캐싱, 쿼리 최적화, 로직 개선을 함께 적용함으로써 최신성과 성능 사이에서 균형을 잡을 수 있었다.

앞으로도 새로운 기능을 설계하거나 성능 문제를 진단할 때, 단일 기술에 의존하기보다는 **애플리케이션 레벨 최적화와 데이터베이스 레벨 최적화**를 함께 고려하는 접근이 필요하다는 점을 다시 한 번 확인할 수 있었다.