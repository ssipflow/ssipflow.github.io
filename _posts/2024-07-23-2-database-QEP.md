---
title: \[DataBase\] 쿼리실행계획 (Query Execution Plan)
layout: single
author_profile: true
comments: true
share: true
related: false
date: '2024-07-23'
tags:
    - DataBase
    - Index
category: DataBase
timezone: Asia/Seoul
---

# 쿼리실행계획(Query Execution Plan) 이해하기
쿼리실행계획(Query Execution Plan, QEP)은 데이터베이스가 쿼리를 처리하기 위해 선택한 전략을 보여주는 중요한 도구이다.
이 포스팅에서는 쿼리실행계획의 개념과 구성요소를 설명하고, 실제 예제를 통해 실행계획을 분석하는 방법에 대해 이야기 하겠다.

## 1. 쿼리실행계획이란?
쿼리실행계획은 데이터베이스가 쿼리를 실행하기 위해 선택한 경로와 방법을 설명한다. 데이터베이스 엔진은 쿼리 성능을 최적화하기 위해 다양한 전략을 사용할 수 있으며, 이 전략이 실행계획에 포함된다.

## 2. 쿼리실행계획 생성방법
쿼리실행계획을 확인하는 방법은 사용하는 데이터베이스 시스템에 따라 다르다. 예를들어
* MySQL: `EXPLAIN` 또는 `EXPLAIN ANALYZE`
* PostgreSQL: `EXPLAIN` 또는 `EXPLAIN ANALYZE`

## 3. 쿼리실행계획 구성요소
쿼리실행계획은 다음과 같은 주요 요소로 구성된다.

### 3.1. 인덱스스캔(Index Scan)
* 인덱스를 사용하여 데이터를 검색하는 방법이다. 인덱스를 사용하면 전체 테이블 스캔보다 빠르게 결과를 찾을 수 있다.
* 예시: `INDEX SCAN`, `INDEX SEEK`

### 3.2. 테이블스캔(Table Scan)
* 인덱스를 사용하지 않고 테이블의 모든 행을 검색하는 방법이다. 인덱스가 없거나 비효율적인 경우 발생한다
* 예시: `FULL TABLE SCAN`

### 3.3. 조인방식(Join Methods)
* 테이블 간의 데이터를 결합할 떄 사용하는 방법이다. 주요 조인 방식에는 Nested Loop, Hash Join, Merge Join이 있다
* 예시: `NESTED LOOP`, `HASH JOIN`, `MERGE JOIN`

### 3.4. 정렬(Sorting)
* 데이터를 정렬하여 결과를 반환하는 과정이다. 정렬 작업은 추가적인 리소스를 소모할 수 있다.
* 예시: `SORT`

### 3.5. 필터링(Filtration)
* 쿼리조건에 맞지 않는 데이터를 필터링하여 결과 집합을 좁히는 과정이다.
* 예시: `FILTER`

## 4. 쿼리실행계획 예제
MySQL 기준으로 쿼리실행게획을 확인해보자

### 예제쿼리
```sql
SELECT * FROM employees WHERE department='Sales';
```

### 실행계획확인
이 쿼리의 실행계획을 확인하기 위해 `EXPLAIN` 명령어를 사용한다.
```sql
EXPLAIN SELECT * FROM employees WHERE department='Sales';
```

### 실행계획 결과
```
+----+-------------+-----------+------+---------------+------+---------+------+-------+----------+-------------+
| id | select_type | table     | type | possible_keys | key  | key_len | ref  | rows  | Extra    |
+----+-------------+-----------+------+---------------+------+---------+------+-------+----------+-------------+
|  1 | SIMPLE      | employees | ref  | department_idx| idx  | 4       | const|  100  | Using where |
+----+-------------+-----------+------+---------------+------+---------+------+-------+----------+-------------+
```

### 실행계획 해석
* type: `ref`는 인덱스를 사용하여 데이터를 검색하고 있다는 의미이다.
* key: `department_idx`는 인덱스의 이름을 나타낸다.
* rows: 100개의 행이 예상된다는 의미
* Extra: Using where`는 WHERE 절을 사용하여 필터링하고 있음을 나타낸다.

## 5. 성능 최적화 방법
쿼리실행계획을 분석하여 성능을 최적화할 수 있는 방법은 다음과 같다

### 5.1. 인덱스 최적화
쿼리에서 자주사용되는 열에 인덱스를 추가하여 검색성능을 개선한다.  
예시: `department`열에 인덱스를 추가하여 쿼리성능을 향상시킬 수 있다.
```sql
CREATE INDEX department_idx ON employees(department);
```

### 5.2 쿼리 리팩토링
비효율적인 쿼리를 리팩토링하여 성능을 개선한다.  
예시: 서브쿼리 대신 조인을 사용하는 쿼리 리팩토링
```sql
SELECT e.name, d.department_name
FROM employees e
JOIN department d ON e.department_id = d.id
WHERE d.department_name = 'Sales';
```

### 5.3. 통계정보 업데이트
데이터베이스의 통계 정보를 최신상태로 유지하여 최적의 실행계획을 생성하도록 한다.  
예시: PostgreSQL에서 통계정보 업데이트
```sql
ANALYZE employees;
```

### 5.4. 쿼리캐싱
자주 실행되는 쿼리의 결과를 캐싱하여 성능을 개선한다.  
예시: MySQL 에서 쿼리 캐싱 활성화
```sql
SET GLOBAL query_cache_size = 1048576;
SET GLOBAL query_cache_type = ON;
```

# 결론
쿼리실행계획은 데이터베이스 성능을 최적화하는 데 필수적인 도구이다. 실행계획을 분석하고 이해함으로써 쿼리성능을 개선하고 데이터베이스의 효율성을 높일 수 있다.
쿼리실행계획의 각 요소를 잘 이해하고, 이를 기반으로 성능을 최적화하는 전략을 세우는 것이 중요하다.