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
# 3. TypeORM 의 캐시
# 4. JPA 1차 캐시 vs TypeORM 캐시
# 5. JPA 시리즈를 마치며