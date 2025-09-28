---
title: \[JPA \#4\] JPA vs TypeORM - JPA 1차 캐시
layout: single
author_profile: true
comments: true
share: true
related: true
date: '2025-09-26'
tags:
    - Spring Boot
    - JPA
category: Spring Boot
timezone: Asia/Seoul
---

# 1. 들어가며
지금까지 JPA 시리즈에서는 **EntityManager, N+1 문제, 트랜잭션 관리, Lock 전략**을 다뤘다. 이번 포스팅에서는 JPA의 또 하나 중요한 특징인 **1차 캐시(Persistence Context Cache)**를 정리 해보려 한다.

최근 TypeORM을 사용하다가 데이터 업데이트 이후에도 변경 전 값이 조회되는 문제를 겪은 적이 있다. 이 경험을 통해 "ORM이 내부적으로 어떤 캐싱을 제공하는가?"에 대한 궁금증이 생겼고, 자연스럽게 JPA의 1차캐시 개념을 다시 살펴보게 되었다.

즉, 이번 글은 JPA 1차 캐시의 동작 방식을 중심으로 설명하되, TypeORM의 캐싱 동작과 비교해 보면서 차이를 살펴보려고 한다.

# 2. JPA 1차 캐시
## 2.1. 1차 캐시란?
JPA 는 **영속성 컨텍스트(Persistence Context)**를 통해 엔티티의 생명주기를 관리한다. 이 영속성 컨텍스트 안에는 **1차 캐시(1st-level cache)**가 존재하는데, 이는 트랜잭션 단위로 유지되는 임시 저장소이다.
- 트랜잭션 범위 안에서 동일한 엔티티를 여러 번 조회하면, DB를 다시 조회하지 않고 1차 캐시에 있는 엔티티를 반환한다.
- 엔티티 변경 시에도 즉시 DB에 UPDATE 쿼리를 보내지 않고, 1차캐시에 기록해 두었다가 `flush` 시점에 한번에 반영한다.
- 트랜잭션이 종료되면 1차 캐시도 함께 사라진다.
즉, JPA 1차 캐시는 성능 최적화와 동시에 데이터 일관성을 유지하는 데 중요한 역할을 한다.

다음은 JPA 1차 캐시의 동작 방식을 보여주는 간단한 예시이다.

```java
@Transactional
public void testFirstLevelCache() {
    // 첫 번째 조회 - DB 에서 SELECT 발생
    Member member1 = entityManager.find(Member.class, 1L);

    // 두번째 조회 - DB SELECT 없음, 1차 캐시에서 반환
    Member member2 = entityManager.find(Member.class, 1L);

    System.out.println(member1 == member2); // true
}
```

### 2.1.1. Hibernate 실행로그
```sql
Hibernate: 
    select
        member0_.id as id1_0_0_,
        member0_.name as name2_0_0_ 
    from
        member member0_ 
    where
        member0_.id=?
```

첫번째 조회(`member1`) 때만 SELECT 로그가 발생하고, 두번째 조회(`member2`)에서는 SELECT 로그가 발생하지 않는다. 이는 DB가 아닌 **1차 캐시에서 엔티티를 반환**했기 때문이다. 따라서 `member1`과 `member2`는 동일한 객체 참조를 가진다. 

## 2.2. Dirty Checking
JPA 1차 캐시는 단순히 엔티티를 캐싱하는것에 그치지 않고, **초기상태(스냅샷)**을 함께 보관한다. 트랜잭션이 끝나는 시점(=flush 시점)에 1차 캐시에 있는 엔티티와 스냅샷을 비교하여 변경된 부분이 있으면 자동으로 UPDATE 쿼리를 생성해 DB에 반영한다. 이를 **Dirty Checking**이라고 한다.

```java
@Transactional
public void updateMemberName(Long id, String newName) {
    Member member = memberRepository.findById(id).orElseThrow();
    member.setName(newName); // 엔티티 속성만 변경

    // 별도의 update() 호출 필요 없음
    // 트랜잭션 종료 시 flush -> Dirty Checking - DB UPDATE 실행
}
```

### 2.2.1. Hibernate 실행로그
```sql
Hibernate:
    select
        member0_.id as id1_0_0_,
        member0_.name as name2_0_0_,
        member0_.version as version3_0_0_
    from
        member member0_ 
    where
        member0_.id=?

Hibernate:
    update
        member 
    set
        name=? 
    where
        id=? and version=?
```
**flush 발생 시점**
- 트랜잭션이 정상적으로 커밋되기 직전
- `JPQL/Criteria` 쿼리 실행 직전
- `entityManager.flush()` 명시적 호출

### 2.2.2. 동작 과정
1. `findById()` 호출 시점에 DB에서 엔티티를 조회하고, 1차 캐시에 저장한다. 이때 엔티티의 초기 상태(스냅샷)도 함께 보관한다.
2. `setName(newName)` 호출로 엔티티의 속성을 변경한다.
3. 트랜잭션이 종료되는 시점에 `flush`가 호출된다.
4. `flush` 시점에 1차 캐시에 있는 엔티티와 스냅샷을 비교하여 변경된 부분이 있는지 확인한다. 변경된 부분이 있으면 자동으로 UPDATE 쿼리를 생성해 DB에 반영한다.
5. 별도의 `update()` 호출이 필요 없다.

### 2.2.3. 실무 주의사항
- **작은 단위의 트랜잭션 로직**에서는 Dirty Checking을 활용하는 것이 간결하고 편리하다.
    - ex) 주문 상태 변경, 회원 이름 수정 등
- **대량 업데이트나 성능이 중요한 구간**에서는 `flush` 시점에 캐시 비교 비용이 커질 수 있어 적합하지 않다. 이 경우 JPQL `update/delete` 같은 벌크 연산을 사용하는 것이 좋다.
- **정합성이 중요한 도메인**(핀테크, 결제, 재고 관리 등)에서는 Dirty Checking 남발을 지양하고, 변경 쿼리를 명시적으로 작성하여 의도를 분명히 하는 것이 좋다.

## 2.3. 동일성 보장 (Identity Guarantee)
JPA 1차 캐시는 동일 트랜잭션 범위 내에서 같은 엔티티를 항상 동일한 객체로 반환한다. 이를 **동일성 보장(Identity Guarantee)**라고 한다. 즉, PK를 가진 엔티티를 조회해도 항상 DB에서 새로 조회하는 것이 아니라, 1차 캐시에 있는 객체를 반환하기 때문에, 항상 같은 인스턴스를 참조한다.

```java
@Transactional
public void testIdentityGuarantee() {
    Member member1 = entityManager.find(Member.class, 1L);
    Member member2 = entityManager.find(Member.class, 1L);

    System.out.println(member1 == member2); // true
}
```
이 특성 덕분에, 트랜잭션 내에서 엔티티의 상태가 일관되게 유지된다. 예를 들어, 회원 엔티티를 여러 번 조회해도 항상 같은 객체를 참조하므로, 변경 사항이 누락되거나 충돌하는 일이 없다.

### 2.3.1. 장점
* **데이터 일관성**: 동일한 트랜잭션 내에서 엔티티 상태가 일관되게 유지된다.
* **성능 최적화**: 동일한 엔티티를 반복 조회할 때 DB 접근을 줄여 성능을 향상시킨다.
* **엔티티 동일성 보장**: `equals()`가 아니라 객체 참조비교(`==`)도 성립한다.

### 2.3.2.실무 주의사항
* **트랜잭션 범위**: 동일성 보장은 트랜잭션 범위 내에서만 유효하다. 트랜잭션이 종료되면 1차 캐시도 사라지므로, 다음 트랜잭션에서는 동일한 엔티티를 다시 조회하면 새로운 객체가 생성된다.
* **영속성 컨텍스트 분리**: 서로 다른 영속성 컨텍스트에서는 동일한 PK를 가진 엔티티라도 다른 객체로 취급된다. 예를 들어, 서로 다른 트랜잭션에서 같은 회원을 조회하면 각각 다른 객체가 생성된다.
* **캐시 무효화**: 1차 캐시는 트랜잭션이 끝나면 사라지므로, 장기적으로 데이터를 캐싱하려면 2차 캐시(예: Hibernate 2nd-level cache)를 사용해야 한다.

# 3. TypeORM 의 캐시
# 4. JPA 1차 캐시 vs TypeORM 캐시
# 5. JPA 시리즈를 마치며