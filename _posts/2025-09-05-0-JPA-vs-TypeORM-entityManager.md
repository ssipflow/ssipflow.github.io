---
title: \[JAP \#1\] JPA vs TypeORM - EntityManager
layout: single
author_profile: true
comments: true
share: true
related: false
date: '2025-09-05'
tags:
    - Spring Boot
    - JPA
category: Spring Boot
timezone: Asia/Seoul
---

# 1. 시작하며
그동안 여러 언어와 프레임워크에서 ORM (Object Relational Model)을 다뤄왔다.
* **Golang** : grom, go-pg
* **TypeScript** : TypeORM
* **Java** : JPA

TypeORM 과 gorm 은 서비스 운영 환경에서 직접 다뤄본 경험이 있지만, JPA 는 서비스 런칭 단계까지 적용한 뒤 이직을 하면서 운영 이슈를 깊게 경험하지 못한 아쉬움이 있다.

개인적으로 새로운 기술을 배울때 개념을 추상적으로 익히고 곧바로 실전에 적용하는 스타일이다. 새로운 기술에 적응할 수 있었지만, 인터뷰 상황에서는 JPA 의 내부 동작 원리나 주의할 점을 매끄럽게 설명하지 못하는 한계가 있었다. 특히 JPA 는 다른 ORM과 비교했을 때, 단순히 **SQL 자동화 도구**로 접근하기 보다 **영속성 컨텍스트, 캐시, 트랜잭션 전파 등 세밀한 주의가 필요한** 부분이 많다고 생각한다.

따라서 이번 포스팅에서는 JPA 의 특징과 주의할 점을 정리하고, TypeORM 과 비교하는 시간을 가지려 한다. 이를 통해 단순한 사용 경험을 넘어 개념적인 이해까지 보완하는 것을 목표로 한다.

# 2. JPA 의 개념
JPA (**Java Persistence API**) 는 자바진영의 ORM 표준 명세다. 관계형 데이터베이스의 데이터를 **자바 객체로 매핑**하고, 객체의 영속성을 관리하기 위한 인터페이스 집합을 정의한다.

JPA 자체는 구현체가 아니며, 대표적인 구현체로 **Hibernate**가 있다. Hibernate는 JPA 명세의 모든 기능을 제공할 뿐 아니라, 표준에 없는 다양한 기능도 함께 제공한다.

# 3. EntityManager 와 영속성 컨텍스트
EntityManager 는 JPA 에서 엔티티를 관리하는 핵심 인터페이스다. 내부적으로 **영속성 컨텍스트**라는 1차 캐시를 다룬다. 영속성 컨텍스트는 엔티티의 **동일성 보장, 변경 감지, 지연로딩** 등의 기능을 지원한다. 엔티티매니저는 이 영속성 컨텍스트를 통해 엔티티의 생명주기를 관리한다.
* Entity 생명주기
    * Transient (비영속)
    * Persistent (영속)
    * Detached (준영속)
    * Removed (삭제)

    ```java
    // Post 는 entity
    Post post = new Post(...);  // 상태: Transient (아직 영속성 컨텍스트에 포함되지 않음)

    em.persist(post);           // Transient -> Persistent (영속 상태로 관리 시작)
    em.find(Post.class, id);    // DB 조회 -> Persistent 상태의 엔티티 반환
    em.remove(post);            // Persistent -> Removed (트랜잭션 커밋 시 삭제)
    em.detach(post);            // Persistent -> Detached (영속성 컨텍스트에서 분리)
    em.merge(post);             // Detached -> Persistent (새로운 영속 객체 반환)
    em.flush();                 // 변경 내용을 DB 에 반영 (상태 변화 없음, 여전히 Persistent)
    em.clear();                 // 모든 영속 객체 -> Detached
    em.close();                 // 영속성 컨텍스트 종료, 모든 엔티티 -> Detached
    ```

## 3.1. TypeORM EntityManager 와의 비교
TypeORM도 EntityManager가 존재한다. 하지만 JPA의 EntityManager 와 성격이 조금 다르다.
* **생명주기 관리**: TypeORM 은 EntityManager의 생명주기 개념이 없다. 단순히 쿼리 실행과 엔티티 매핑 역할을 한다.
* **Entity 상태**: Entity 는 단순한 클래스 (POJO/DTO)일 뿐 **상태 전이를 관리하지 않는다.**
* **변경감지**: 변경감지 (DirtyCheck) 기능이 없다. 수정시 항상 `save()/update()` 호출이 필요하다.
* **지연로딩**: Lazy/Eager 로딩은 설정 기반이지만, 지연로딩을 위해 Promise를 반환하는 수준에 그친다.

결론적으로, JPA EntityManager 는 **상태 관리 중심**, TypeORM EntityManager 는 **SQL 실행 중심**이다. 따라서 TypeORM 에서는 정합성 관리와 트랜잭션 범위 설정 책임이 개발자에게 더 크게 돌아온다.