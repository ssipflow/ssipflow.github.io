---
title: \[JPA \#3\] JPA vs TypeORM - Transaction
layout: single
author_profile: true
comments: true
share: true
related: true
date: '2025-09-22'
tags:
    - Spring Boot
    - JPA
category: Spring Boot
timezone: Asia/Seoul
---

# 1. Transaction
트랜잭션은 데이터베이스의 일관성을 보장하기 위한 방법으로, ACID 원칙을 따른다.
- **원자성(Atomicity)**: 전부 수행되거나 전부 취소된다.  
- **일관성(Consistency)**: 트랜잭션 전후로 데이터 무결성이 유지된다.  
- **격리성(Isolation)**: 동시에 실행되는 트랜잭션은 서로 간섭하지 않는다.  
- **지속성(Durability)**: 커밋된 데이터는 영구적으로 보존된다.  

이 중에서도 ORM 에서는 특히 **격리성**이 중요하다. 여러 트랜잭션이 동시에 엔티티를 갱신할 때, 정합성을 깨지 않으려면 **트랜잭션 경계**가 올바르게 설정되어야 한다.

- JPA 는 `EntityManager`와 영속성 컨텍스트가 트랜잭션 단위로 동작하며, `@Transactional`을 통해 격리 수준과 경계를 선언한다.
- TypeORM은 상태 관리 개념이 없으므로, `QueryRunner`나 `TransactionManager`로 격리 수준과 경계를 직접 지정해야 한다.

이번 포스팅에서는 Spring Data JPA 의 `@Transactional`의 특징에 대해 다룰것이며, 트랜잭션의 특징과 TypeORM 트랜잭션과의 차이점에 대해 서술할 것이다.

# 2. Spring Data JPA 트랜잭션 관리
## 2.1. @Transactional
`@Transactional`은 **Spring AOP Proxy**를 이용해 트랜잭션을 선언적으로 관리할 수 있게 한다. 개발자가 직접 `commit()`이나 `rollback()`을 호출하지 않아도, 메서드 실행이 정상 종료되면 커밋되고 예외가 발생하면 롤백된다.

스프링의 기본 정책은 다음과 같다.
- **Unchecked Exception(RuntimeException, Error)** 발생 시 -> **Rollback**
- **Checked Exception** 발생 시 -> **commit**

이 방식은 다음과 같은 장점을 가진다.
- 트랜잭션 경계를 명확하게 선언할 수 있다.
- 중첩된 서비스 호출도 동일한 트랜잭션 안에서 관리할 수 있다.
- 트랜잭션 관리 로직을 코드에 직접 작성하지 않아도 된다.

### 예시
```java
@Service
public class OrderService {

    private final OrderRepository orderRepository

    public OderService(OrderRepository orderRepository) {
        this.orderRepository = orderRepository;
    }

    @Transactional
    public void placeOrder(Long productId, Long userId) {
        Order order = new Order(productId, userId);
        orderRepository.save(order)
        // commit/rollback 은 Spring AOP 에서 자동 처리
    }
}
```

## 2.2. 트랜잭션과 EntityManager
Spring Data JPA에서 하나의 트랜잭션은 하나의 `EntityManager`와 연결된다. 
트랜잭션이 시작되면 스프링은 데이터베이스 커넥션을 획득하고, 이를 새로운 `EntityManager`에 바인딩한다.
이후 트랜잭션 경계가 끝날때까지 동일한 `EntityManager`를 사용한다.

이를 통해 다음이 보장된다.
- 동일 엔티티 조회 시 1차 캐시를 통한 **동일성 보장**
- 엔티티 변경 시 별도 `update()` 호출 없이 **Dirty Checking**으로 자동 반영
- 커밋 시점(메서드 종료 시점)에만 **flush() -> SQL 실행 -> commit** 순서로 데이터베이스에 반영
- 예외 발생 시 전체 트랜잭션이 **rollback** 처리

### 예시
```java
@Service
public class OrderService {
    
    private final OrderRepository orderRepository;
    private final PaymentRepository paymentRepository;

    public OrderService(OrderRepository orderRepository, PaymentRepository paymentRepository) {
        this.orderRepository = orderRepository;
        this.paymentRepository = paymentRepository;
    }

    @Transactional
    public void placeOrder(Long productId, Long userId) {
        // 같은 트랜잭션/영속성 컨텍스트 안에서 실행됨
        Order order = new Order(productId, userId);
        orderRepository.save(order);    // INSERT SQL 지연(flush 전까지 DB 미반영)

        Payment payment = new Payment(order.getId(), 10000L);
        paymentRepository.save(payment);    // orderRepository 와 같은 EntityManager 사용

        // 메서드 정상 종료 -> flush -> commit -> DB 반영 
    }
}
```
트랜잭션이 종료되면 EntityManager와 영속성 컨텍스트도 함께 닫힌다.
이때문에 트랜잭션 밖에서 지연로딩을 시도하면 `LazyInitializationException`이 발생한다.

### @Transactional 이 없는 경우
서비스 메서드에 트랜잭션 경계가 없으면 Repository 호출마다 새로운 `EntityManager`가 생성된다.
`findById()` 같은 Repository 메서드는 내부적으로 자체 트랜잭션(read-only)을 사용하기 때문에, 호출이 끝나면 `EntityManager`가 바로 닫힌다.
그 결과 반환된 엔티티는 이미 **Detached 상태**이며, 변경 추적(Dirty Checking)이 일어나지 않는다.

```java
// @Transactional 이 없는 경우
User u1 = userRepository.findById(1L).get();    // 첫 번째 EntityManager
u1.setName("new Name");                         // 영속성 상태는 이미 Detached 상태, 변경 추적 안됨

User u2 = userRepository.findById(1L).get();    // 두 번째 EntityManager
// u1 != u2 (다른 객체 인스턴스)
// 1차 캐시가 공유 불가 -> Dirty Checking 효과 없음
```

## 2.3. 트랜잭션 전파옵션 (Propagation)
## 2.4. 트랜잭션 격리수준 (Isolation level)

# 3. TypeORM의 트랜잭션 관리

# 4. 결론