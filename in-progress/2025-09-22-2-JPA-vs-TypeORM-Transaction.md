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
트랜잭션 전파(Propagation)는 이미 진행 중인 트랜잭션이 있을 때, 새로운 트랜잭션 경계를 어떻게 적용할지를 결정한다.
스프링은 `@Transactional`의 `propagation` 속성을 통해 전파 방식을 지정할 수 있다.

### 주요 옵션
- **REQUIRED (기본값)**
    - 실행중인 기존 트랜잭션에 참여한다. 기존에 실행중인 트랜잭션이 없으면 새로운 트랜잭션을 만든다.
    - 가장 일반적으로 사용되는 방식.
- **REQUIRES_NEW**
    - 항상 새로운 트랜잭션을 시작한다.
    - 기존 트랜잭션은 잠시 보류된다.
    - 독립적인 작업(로그 기록 등)에 사용.
- **NESTED**
    - 부모 트랜잭션 안에서 중첩 트랜잭션을 시작한다.
    - 부모 롤백 시 같이 자식 트랜잭션도 롤백.
    - 자식 롤백 시 부모 트랜잭션에 영향을 주지 않는다. (부모 트랜잭션은 그대로 실행)
    - *save point*를 지원하는 DB 에서만 동작한다.
- **MANDATORY**
    - 반드시 기존 트랜잭션이 존재해야 한다.
    - 기존 트랜잭션이 없으면 예외 발생.
- **NEVER**
    - 항상 트랜잭션 없이 실행한다.
    - 기존 트랜잭션이 있으면 예외 발생.
- **SUPPORTS**
    - 기존 트랜잭션이 있으면 참여한다.
    - 기존 트랜잭션이 없으면 트랜잭션 없이 실행.
- **NOT_SUPPORTED**
    - 기존 트랜잭션이 있으면 잠시  중단시키고, 트랜잭션 없이 실행.

### 예시 A) REQUIRED: 한번에 묶기 (UseCase 레벨)
- 주문 생성과 결제 승인까지 하나의 트랜잭션으로 처리
- UseCase(서비스)에서 `@Transactional` **REQUIRED**(기본값) 선언
```java
// Application Layer
@Service
public class PlaceOrderUseCase {

    private final OrderPort orderPort;
    private final PaymentPort paymentPort;

    public PlaceOrderUseCase(OrderPort orderPort, PaymentPort paymentPort) {
        this.orderPort = orderPort;
        this.paymentPort = paymentPort;
    }

    // REQUIRED(기본값): 호출 체인을 하나의 트랜잭션으로 처리
    // 각 port 메서드는 기본값(REQUIRED) 전파옵션 사용
    @Transactional
    public void execute(Long userId, Long productId) {
        Long orderId = orderPort.createOrder(userId, productId);    // INSERT (지연 flush)
        paymentPort.approvePayment(orderId);                        // UPDATE/INSERT 등
        // 메서드 정상 종료 -> flush -> commit
    }
}
```
- `createOrder`와 `approvePayment`가 **동일 EntityManager/영속성컨텍스트**로 수행되어 동일성 보장, Dirty Checking 반영, 원자성 확보 등의 효과를 갖는다.

### 예시 B) REQUIRES_NEW: 기존 트랜잭션과 운영 분리
- 기존 트랜잭션은 진행시키면서, 부가 로그/아웃박스는 **별도 트랜잭션**으로 커밋
- 실패해도 기존 트랜잭션에 영향 없음.
- **Adapter** 에서 `REQUIRES_NEW`를 선언하여 분리한다.
```java
@Repository
public class AuditLogJpaAdapter implements AuditLogPort {
    
    private final AuditLogRepository auditLogRepository;

    public AuditLogJpaAdapter(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    // 항상 새로운 트랜잭션으로 감사 로그 기록
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    @Override
    public void writeAudit(String action, Long userId) {
        auditLogRepository.save(new AuditLog(action, userId));
        // 여기서 예외 발생 시, 이 트랜잭션만 롤백, 기존 트랜잭션은 유지
    }
}
```
```java
// Application Layer - UserCase에서 호출
@Service
public class PlaceOrderUseCase {

    private final OrderPort orderPort;
    private final PaymentPort paymentPort;
    private final AuditLogPort auditLogPort;

    public PlaceOrderUseCase(OrderPort orderPort, PaymentPort paymentPort, AuditLogPort auditLogPort) {
        this.orderPort = orderPort;
        this.paymentPort = paymentPort;
        this.auditLogPort = auditLogPort;
    }

    @Transactional
    public void execute(Long userId, Long productId) {
        // 본 트랜잭션
        Long orderId = orderPort.createOrder(userId, productId);    // REQUIRED
        paymentPort.approvePayment(orderId);    //REQUIRED

        // 별도 트랜잭션 REQUIRES_NEW
        // 이 트랜잭션의 실패는 기존 트랜잭션(REQUIRED)에 영향을 주지 않음
        auditLogPort.writeAudit("ORDER_PLACED", userId);   
    }
}
```
- 본 트랜잭션 성공 + Audit Log 실패 -> 주문은 커밋, Audit Log 만 롤백
- 본 트랜잭션 실패 -> Audit Log 는 이미 커밋되어서 유지된다.
- REQUIRES_NEW 는 **추가 커넥션을 점유한다**. 고빈도 사용 시 커넥션 풀 고갈에 주의해야 한다.
- 로깅/아웃박스 처럼 트랜잭션 실패가 비즈니스 로직에 영향을 끼치면 안되는 부수 작업에 한정한다.

## 2.4. 트랜잭션 격리수준 (Isolation level)

# 3. TypeORM의 트랜잭션 관리

# 4. 결론