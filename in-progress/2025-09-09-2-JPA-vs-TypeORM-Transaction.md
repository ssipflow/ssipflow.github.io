---
title: \[JPA \#3\] JPA vs TypeORM - Transaction
layout: single
author_profile: true
comments: true
share: true
related: true
date: '2025-09-09'
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
`@Transactional`은 **Spring AOP Proxy**를 통해 트랜잭션 경계를 지정한다. 트랜잭션 경계에 포함된 영속성 컨텍스트는 동일한 `EntityManager` 를 사용하여 하나의 트랜잭션 안에서 묶이게 된다. 

트랜잭션이 시작되면 스프링은 데이터베이스 커넥션을 가져와 `EntityManager`에 바인딩 한다. 그 이후 서비스 계층에서 여러 Repository를 호출하더라도, 같은 트랜잭션 내에서는 **동일한 영속성 컨텍스트**를 공유한다.

이를 통해 다음이 보장된다.
- 동일 엔티티 조회 시 1차 캐시를 통한 **동일성 보장**한다.
- 엔티티 변경 시 별도 `update()` 호출 없이 **Dirty Checking**으로 자동 반영한다.
- 커밋 시점에만 **flush -> SQL 실행 -> commit** 순서로 데이터베이스에 반영한다.
- 예외 발생 시 트랜잭션 전체가 **rollback** 처리한다.

    ```java
    @Service
    public class OrderService {

        private final OrderRepository orderRepository;
        private final PaymentRepository paymentRepository;

        public OrderService(OrderRepository orderRepository,
                            PaymentRepository paymentRepository) {
            this.orderRepository = orderRepository;
            this.paymentRepository = paymentRepository;
        }

        // 트랜잭션 경계 선언
        @Transactional
        public void placeOrder(Long productId, Long userId) {
            // 같은 트랜잭션/영속성 컨텍스트 안에서 실행됨
            Order order = new Order(productId, userId);
            orderRepository.save(order);   // INSERT SQL 지연(flush 전까지 DB 미반영)

            Payment payment = new Payment(order.getId(), 10000L);
            paymentRepository.save(payment); // 같은 EntityManager 사용

            // 여기까지는 SQL 실행되지 않음
            // 메서드 정상 종료 → flush → commit → DB 반영
        }
    }
    ```

## 2.2. 트랜잭션과 EntityManager
## 2.3. 트랜잭션 전파옵션 (Propagation)
## 2.4. 트랜잭션 격리수준 (Isolation level)

# 3. TypeORM의 트랜잭션 관리

# 4. 결론