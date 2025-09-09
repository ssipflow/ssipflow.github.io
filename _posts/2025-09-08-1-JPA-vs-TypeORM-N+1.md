---
title: \[JPA \#2\] JPA vs TypeORM - N+1
layout: single
author_profile: true
comments: true
share: true
related: true
date: '2025-09-08'
tags:
    - Spring Boot
    - JPA
category: Spring Boot
timezone: Asia/Seoul
---

# 1. N+1 문제
ORM을 사용하면 EntityManager를 통해 객체와 DB간 매핑이 자동으로 처리되므로 개발자는 데이터를 객체로 다루기만 하면 된다. 하지만 이 편리함 뒤에는 몇가지 성능 문제가 숨어있으며, 그중 대표적인 것이 **N+1 문제**다.

JPA 는 성능 최적화를 위해 연관 엔티티 로딩전략을 기본적으로 **지연 로딩(Lazy Loading)**으로 설정한다. 지연 로딩은 연관된 엔티티를 즉시 가져오지 않고, 실제 해당 엔티티에 접근하는 순간 추가 쿼리를 실행한다. 이때 의도치 않게 연관 엔티티를 한 건씩 개별 조회하면서, 최초 1번의 조회 쿼리와 이어지는 **N번의 추가 조회 쿼리**가 발생하게 된다. 그 결과 총 N+1번의 쿼리가 실행되며, 이는 성능저하로 이어진다. 

> * **Lazy Loading**: 연관 엔티티를 즉시 가져오지 않고, 실제 접근 시점에 추가 쿼리를 실행한다. -> 성능 최적화를 위해 기본값으로 채택되지만, 컬렉션/연관 데이터에 반복 접근하면 **N+1 문제가 발생**한다.  
> * **Eager Loading**: 연관 엔티티를 항상 즉시 로딩한다. -> N+1은 피할 수 있지만, 구현체 전략(Hibernate)에 따라 **추가 쿼리**가 여전히 발생할 수 있고, 필요 없는 연관까지 항상 가져와서 **과로딩 및 성능 저하**가 생길 수 있다.

> 즉, 기본은 Lazy로 두되, 필요한 시점에만 **Fetch Join, EntityGraph, DTO Projection** 등을 통해 명시적으로 연관 로딩을 제어하는 것이 일반적인 실무 전략이다.

# 2. 예시
* **Entity**
    ```java
    @Entity
    public class Member {
        @Id @GeneratedValue
        private Long id;

        private String name;

        @OneToMany(mappedBy = "member", fetch = FetchType.LAZY) // 기본 Lazy
        private List<Order> orders = new ArrayList<>();
    }

    @Entity
    @Table(name = "orders")
    public class Order {
        @Id @GeneratedValue
        private Long id;

        private String title;

        @ManyToOne(fetch = FetchType.LAZY)
        @JoinColumn(name = "member_id")
        private Member member;
    }
    ```

* **Repository and Service**
    ```java
    // 부모들 먼저 조회 (연관 미로딩)
    List<Member> members = em.createQuery(
        "select m from Member m order by m.id", Member.class
    ).getResultList();

    // 이후 컬렉션 접근(N+1 유발)
    for (Member m : members) {
        // 여기서 m.getOrders().size() 접근 시, 회원마다 추가 쿼리 발생
        int orderCount = m.getOrders().size();
    }
    ```

* **Hibernate Log**
    ```sql
    -- 1) 부모 조회 (1번)
    select m1_0.id, m1_0.name
    from member m1_0
    order by m1_0.id;

    -- 2) 각 부모별 자식 조회 (N번)
    select o1_0.member_id, o1_0.id, o1_0.title
    from orders o1_0
    where o1_0.member_id = ?;  -- memberId = 1

    select o1_0.member_id, o1_0.id, o1_0.title
    from orders o1_0
    where o1_0.member_id = ?;  -- memberId = 2
    ...
    ```

    * **N+1 Queries**: Hibernate Log 를 확인해 보면, 부모테이블인 `Member` 쿼리 는  1회, 자식 테이블인 `Order` 쿼리는 N회 발생하는 것을 확인할 수 있다.

# 3. N+1 문제 해결
1. **Fetch Join**: N+1 문제를 해결하기 위한 가장 일반적인 방식으로, **JPQL**에서 `join fetch`를 사용해 필요한 연관 엔티티를 한번에 가져오는 방식이다. 
    * **Repository**
        ```java
        List<Member> members = em.createQuery(
            "select distinct m from Member m " +
            "left join fetch m.orders o " +
            "order by m.id",
            Member.class
        ).getResultList();
        ```

    * **Hibernate Log**
        ```sql
        -- join fetch로 한 번에
        select distinct m1_0.id, m1_0.name,
            o1_0.id, o1_0.member_id, o1_0.title
        from member m1_0
        left join orders o1_0 on o1_0.member_id = m1_0.id
        order by m1_0.id;
        ```

        * **1 Query**로 부모+자식 로딩
        * **To-Many fetch join + 페이징은 행 폭증으로 페이징이 깨질 수 있다.** 자세한 내용은 ```3.2.2절```에서 다룰것이다.

2. **DTO Projection**: 필요한 필드만 **JPQL/QueryDSL**로 직접 조회하여 N+1 자체를 **회피**한다. API 응답 DTO 설계 시 자주 사용한다.
    * **DTO 정의**
        ```java
        public record MemberOrderRow(Long memberId, String memberName,
                                    Long orderId, String orderTitle) {}
        ```
    
    * **JPQL/QueryDSL**
        ```java
        // JPQL (Member-Order Flat Join)
        List<MemberOrderRow> rows = em.createQuery(
            "select new com.example.MemberOrderRow(m.id, m.name, o.id, o.title) " +
            "from Member m left join m.orders o " +
            "order by m.id, o.id",
            MemberOrderRow.class
        ).getResultList();

        // 또는 QueryDSL
        List<MemberOrderRow> rows = queryFactory
            .select(Projections.constructor(MemberOrderRow.class,
                member.id, member.name, order.id, order.title))
            .from(member)
            .leftJoin(member.orders, order)
            .orderBy(member.id.asc(), order.id.asc())
            .fetch();
        ```
    
    * **Hibernate Log**
        ```sql
        -- 필요한 컬럼만 Flat Join 으로 한 번에 로드
        select m1_0.id, m1_0.name,
            o1_0.id, o1_0.title
        from member m1_0
        left join orders o1_0 on o1_0.member_id = m1_0.id
        order by m1_0.id, o1_0.id;
        ```

        * Entity가 아닌 DTO로 받아 **영속성 컨텍스트 비용 없이** N+1 문제 회피가 가능하다.
        * 응답 조립은 Service/응답 조립 레이어에서 (`memberId + orders[]`) 그루핑으로 처리한다.

## 3.1. Fetch Join 시 Pagination
N+1 문제 해결을 위해 가장 많이 사용하는 전략은 **Fetch Join**이다. 하지만 Fetch Join 을 사용할 때 **페이징(Pageable)**과 함께 사용하면 두 가지 문제가 대표적으로 발생한다.

> 1. **결과 개수 깨짐** (Row 기준으로 잘려 부모 수 가 줄어듬)
> 2. **메모리 폭증** (조인 결과가 폭증하여 중복 제거/그래프 조립 과정에서 OutOfMemory 위험)

아래 예시로 살펴보자

### 3.1.1. **예시: ToMany에 fetch join + 페이징 적용**
```java
// Member : Order = 1 : N
List<Member> result = em.createQuery(
    "select m from Member m " +
    "join fetch m.orders o " +
    "order by m.id",
    Member.class
)
.setFirstResult(0)
.setMaxResults(10) // 부모 10명을 기대
.getResultList();
```

* **문제 1**: 결과 개수 깨짐
    * `limit 10`이 부모 (Member) 기준이 아니라 **조인 Row 기준으로 적용**되어, 실제 반환된 회원 수는 10명이 아닐 수 있다 (주문이 많은 회원만 일부 반환).
    * **Hibernate Log**
        ```sql
        -- 조인된 Row에 대해 limit가 적용됨
        select m1_0.id, m1_0.name, o1_0.id, o1_0.member_id, o1_0.title
        from member m1_0
        join orders o1_0 on o1_0.member_id = m1_0.id
        order by m1_0.id
        limit 10
        ```
* **문제 2**: 메모리 폭증(OOM 위험) 시나리오
    * `ToMany fetch join`은 조인 결과 **모든 Row를 애플리케이션으로 가져온 뒤, Hibernate 가 중복 제거와 엔티티 그래프 조립**을 수행한다. 자식이 매우 많은 경우(예: 한 회원당 주문 1만건), 한 페이지의 부모만 의도했더라도 **조인 Row는 수십만 건이 될 수 있다.**
    * 반환 Row 전량을 메모리에 적재 -> 엔티티 중복제거/그래프 조립 -> GC 부담/OOM 위험 발생
    * 특히 페이징을 섞으면 Row 기준 잘림 + 메모리 폭증이 동시에 발생할 수 있다.
    * **Hibernate Log**
        ```sql
        select m1_0.id, m1_0.name, o1_0.id, o1_0.member_id, o1_0.title, ...
        from member m1_0
        join orders o1_0 on o1_0.member_id = m1_0.id
        where ...
        order by m1_0.id
        -- (Row 폭증: 수십만 건 이상)
        ```

### 3.1.2. **문제해결(실무 권장 패턴)**
#### 1. To-One 은 fetch join + Pageable 그대로 사용
To-One(ManyToOne/OneToOne) fetch join은 조인으로 행이 불어나지 않기 때문에 페이징과 함께 써도 안전하다.
```java
// To-One만 fetch join
// Repository
@Query("""
select o from Order o
join fetch o.member m      -- To-One fetch join
where o.status = :status
order by o.id desc
""")
Page<Order> findByStatusWithMember(@Param("status") OrderStatus status, Pageable pageable);
```

#### 2. To-Many 는 fetch join 대신 다음중 옵션들을 사용한다.
* 2-1. BatchSize / default_batch_fetch_size (N+1 완화)
    * 부모 페이지를 먼저 엔티티로 로딩 (To-One은 fetch join 허용)
    * 이후 컬렉션 접근 시 Hibernate 가 IN 쿼리로 자식들을 묶어서 가져온다
    * 설정 (application.yaml)
        ```yaml
        spring:
            jpa:
                properties:
                    hibernate:
                        default_batch_fetch_size: 50
        ```
    * **Hibernate Log**
        ```sql
        -- 부모 페이지 먼저(N개)
        select m1_0.id, m1_0.name, p1_0.id, ...
        from member m1_0
        left join profile p1_0 on p1_0.member_id = m1_0.id
        order by m1_0.id
        limit ?, ?

        -- 컬렉션 접근 시 IN으로 묶어 조회(최대 50개씩)
        select o1_0.member_id, o1_0.id, o1_0.title
        from orders o1_0
        where o1_0.member_id in (?, ?, ..., ?)
        ```

* 2-2. 2단계 조회 (ID 페이징 -> 본조회)
    * 1단계: 부모 ID만 정확히 페이지로 자른다.
    * 2단계: `where parent.id in (:ids) 조건으로 본 조회(필요 시 To-One fetch join, To-Many는 일반조인 + DTO)
    * **QueryDSL 예시**
        ```java
        // 1) 부모 ID만 페이징
        List<Long> parentIds = queryFactory
            .select(member.id)
            .from(member)
            .where(member.active.isTrue())
            .orderBy(member.id.asc())
            .offset(pageable.getOffset())
            .limit(pageable.getPageSize())
            .fetch();

        // 2) 본 조회: DTO Flat Join (To-One은 fetchJoin 사용 가능)
        List<MemberOrderRow> rows = queryFactory
            .select(Projections.constructor(MemberOrderRow.class,
                member.id, member.name,
                order.id, order.title))
            .from(member)
            .leftJoin(member.orders, order) // To-Many: 일반 조인
            .where(member.id.in(parentIds))
            .orderBy(member.id.asc(), order.id.asc())
            .fetch();
        ```
    * 특징
        * 페이지 정확도 보장 (부모 기준)
        * 응답은 서비스 레이어에서 (`memberId -> orders[]`)로 그룹핑해서 조립.
        * countQuery 는 부모 기준으로 가볍게 분리.

### 3.1.3. 결론
* **To-One fetch join + 페이징**: 행 폭증이 없으므로 안전. N+1 제거에 유효
* **To-Many fetch join + 페이징**: 실무에서는 피해야 하는 패턴
    * Row 기준 잘림으로 결과 개수 왜곡
    * 조인 결과 폭증으로 메모리 사용량 급증/OOM 위험
* **권장 패턴**
    * To-One 은 fetch join 으로 N+1 제거
    * To-Many 는 BatchSize, 두단계 조회 등 요구에 맞게 설계

# 4. JPA vs TypeORM: N+1 접근 차이
TypeORM 역시 ORM 특성상 N+1 문제가 발생한다. 다만, **영속성 컨텍스트(Persistent Context) 유무로 인해, N+1 을 해결하는 접근 방식이 JPA 와 다르다.**

## 4.1. JPA의 N+1 문제 
JPA 의 N+1 문제는 Lazy Loading 프록시가 연관 엔티티 접근 시 영속성 컨텍스트를 통해 쿼리를 날리기 때문에 발생한다. 영속성 컨텍스트가 엔티티 상태를 관리하므로 동일성 보장, Dirty Checking, BatchSize 최적화, Fetch Join 시 중복 제거 등 다양한 최적화 기능을 제공한다.
* N+1 문제 해결 방법
    * Fetch Join, EntityGraph
    * BatchSize / default_batch_fetch_size
    * DTO Projection (조회 전용)
    * 두 단계 조회 (부모 ID 페이징 -> 본 조회)

## 4.2. TypeORM의 N+1 문제
Lazy Promise에 접근할 때마다 새 쿼리를 실행하는 것으로 N+1 문제가 발생한다. 영속성 컨텍스트가 없으므로 상태 추적이나 동일성 보장이 없고, 쿼리 실행 결과를 매핑해 객체로 반환한다.
* N+1 문제 해결방법
    * `QueryBuilder.leftJoinAndSelect()`로 필요한 연관만 미리 Join
    * `relationLoadStrategy: 'join' | 'query'` 전역 옵션 활용
    * DTO Projection / select()로 필요한 컬럼만 가져오기
    * (To-Many 관계 페이징 시) 중복 Row 직접 그룹핑 처리

## 비교요약

| 구분 | JPA | TypeORM |
|------|-----|----------|
| **원인** | Lazy 프록시 + 영속성 컨텍스트 초기화 | Lazy Promise 접근마다 쿼리 실행 |
| **영속성 컨텍스트** | 있음 → 동일성 보장, Dirty Checking, BatchSize 최적화 | 없음 → 단순 매핑, 상태 관리 X |
| **대표 해결책** | Fetch Join, EntityGraph, BatchSize, DTO Projection | QueryBuilder join, relationLoadStrategy, DTO Projection |
| **To-Many 페이징** | Fetch join 불가 → 두 단계 조회, BatchSize | Row 폭증 동일, 중복 제거는 직접 그룹핑 |
| **핵심 차이** | ORM이 엔티티 상태/그래프를 관리하며 최적화 기능 활용 | 쿼리 결과만 반환, 최적화는 개발자 책임 |


> 결론적으로, **JPA는 영속성 컨텍스트를 중심으로 N+1을 제어**하고,  
> **TypeORM은 영속성 컨텍스트가 없기 때문에 철저히 쿼리 레벨에서 해결**해야 한다. 