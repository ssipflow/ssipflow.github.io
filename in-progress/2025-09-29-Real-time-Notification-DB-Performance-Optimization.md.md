---
title: \[Spring\] 실시간 알림 DB 부하 개선 사례 (80% 감소)
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
category: Operation
timezone: Asia/Seoul
---

# 0. 들어가며
이번 사례는 실제로는 **NestJS 기반 프로젝트**에서 발생한 문제이다. 다만 포스팅에서는 내가 부족하다고 느끼는 **Spring 실전 사례 인사이트를 보강**하기 위해, 시나리오와 예시 코드를 **Java/Spring** 환경으로 재구성했다. 아키텍처적 아이디어와 개선 방식 자체는 프레임워크와 무관하게 동일하게 적용 가능하다.

실시간 알림 기능은 사용자 경험을 높이는 핵심 요소이다. 그러나 잘못된 구현은 DB 부하를 유발하고 전체 시스템 안정성을 떨어뜨린다. 이번 글에서는 실시간 알림 기능으로 인해 발생한 DB 부하 문제를 어떻게 진단하고, 캐싱과 쿼리 최적화를 통해 80% 이상 줄였는지 과정을 공유한다.

# 1. 문제 현상
- 기능: WebSocket 기반 실시간 알림 전송
- 증상: 접속자가 몰리는 시간대에 DB CPU 사용률이 80~90%까지 급상승
- 코드 위치(예시): `NotificationPushScheduler.java`

# 2. 문제 원인 분석
## 원인 1. 과도환 DB 풀링
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

- TODO: Explain 결과 분석 설명 추가

# 3. 개선 방안
## 해결책 1. 캐싱 도입
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
Cache-Aside 전략 적용 → TTL 3초 설정으로 DB 조회 빈도를 줄임.   # TODO: Cache-Aside 전략 설명 추가

## 해결책 2. 쿼리 튜닝 + 인덱스 최적화
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

- TODO: Explain 결과 분석 설명 추가
- 풀 스캔 제거, 인덱스 기반 조회로 성능 개선.

# 4. 개선 결과
- DB CPU 사용률: 80~90% → 10~15% (약 80% 감소)
- 알림 전송 지연 시간: 평균 300ms → 50ms (약 83% 감소)
- 시스템 안정성 향상, 사용자 경험 개선 

# 5. 마치며