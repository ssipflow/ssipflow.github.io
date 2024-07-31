---
title: \[DataBase\] Database Optimization - Join
layout: single
author_profile: true
comments: true
share: true
related: false
date: '2024-07-24'
tags:
    - DataBase
    - Join
category: DataBase
timezone: Asia/Seoul
---

# Join과 Join Methods
데이터베이스에서 여러 테이블의 데이터를 결합할 떄 조인(Join)은 핵심적인 역할을 한다. 
SQL 쿼리에서 조인은 테이블간의 관계를 정의하고, 필요한 데이터를 효율적으로 검색할 수 있게 해준다.
이 포스팅에서는 조인의 종류와 조인 메소드에 대해 설명할 것이다.

## 1. 조인의 종류 (Join Types)
조인은 데이터베이스에서 테이블을 결합하여 관련 데이터를 조회하는 방법을 정의한다. 주요 조인 종류는 다음과 같다.

### 1.1. INNER JOIN
INNER JOIN은 두 테이블에서 일치하는 레코드만을 반환한다. 두 테이블의 공통된 값을 기준으로 결합되며, 일치하지 않는 데이터는 결과에 포함되지 않는다.
```sql
SELECT *
FROM orders o
INNER JOIN customers c
ON o.customer_id = c.id
```

### 1.2. LEFT JOIN (LEFT OUTER JOIN)
LEFT JOIN 은 왼쪽 테이블의 모든 레코드와 오른쪽 테이블의 일치하는 레코드를 반환한다. 오른쪽 테이블에서 일치하지 않는 레코드는 NULL로 채워진다.
```sql
SELECT *
FROM orders o
LEFT JOIN customers c
ON o.customer_id = c.id
```

### 1.3. RIGHT JOIN (RIGHT OUTER JOIN)
RIGHT JOIN은 오른쪽 테이블의 모든 레코드와 왼쪽 테이블의 일치하는 레코드를 반환한다. 왼쪽 테이블에서 일치하지 않는 레코드는 NULL로 채워진다.
```sql
SELECT *
FROM orders o
RIGHT JOIN customers c
ON o.customer_id = c.id
```

### 1.4. FULL JOIN (FULL OUTER JOIN)
FULL JOIN은 두 테이블의 모든 레코드를 반환한다. 일치하지 않는 레코드는 NULL로 채워진다.
```sql
SELECT *
FROM orders o
FULL JOIN customers c
ON o.customer_id = c.id
```

### 1.5. CROSS JOIN
CROSS JOIN은 두 테이블의 Cartesian Product를 반환한다. 즉, 두 테이블의 모든 행을 결합하여 모든 조합을 생성한다.
```sql
SELECT *
FROM orders o
CROSS JOIN customers c
```

### 1.6. SELF JOIN
SELF JOIN은 동일한 테이블을 두번 조인하여 행을 서로 결합한다. 일반적으로 계층구조를 나타낼 때 사용한다.
```sql
SELECT A.*, B.*
FROM employees A
JOIN employees B
ON a.manager_id = b.employee_id
```

## 2. 조인 메소드 (Join Methods)
조인메소드는 데이터베이스 엔진이 조인 연산을 수행할 때 사용하는 알고리즘이다. 각 메소드는 조인의 성능과 효율성에 영향을 미친다. 주요 조인메소드는 다음과 같다.

### 2.1. Nested Loop Join
Nested Loop Join은 두 테이블의 모든 행을 비교하는 방법이다. 이 방법은 가장 간단하지만, 테이블이 크면 성능이 저할될 수 있다. 모든 행 조합을 검사하므로 O(N*M)의 시간 복잡도를 가진다.

### 2.2. Hash Join
Hash Join은 작은 테이블을 해시 테이블로 변환하고, 큰 테이블과 해시 테이블을 비교하는 방식이다. 이 방식은 대규모 데이터셋에서 효율적이며, 평균적으로 O(N+M)의 시간 복잡도를 가진다.

### 2.3. Merge Join
Merge Join은 두 테이블이 정렬된 상태에서 병합하는 방식이다. 정렬된 데이터에서 매우 효율적이며, O(N+M)의 시간복잡도를 가진다. 이 방법은 두 테이블이 정렬되어 있어야 사용 가능하다.

## 3. Join Types와 Join Methods의 차이
* **Join Types**: SQL 쿼리에서 테이블을 결합하는 방법을 정의하며, 결과로 반환되는 데이터의 형태와 일치하는 레코드의 유형을 결정한다.
* **Join Methods**: 데이터베이스 엔진이 조인 연산을 수행하는 내부 알고리즘이나 방식이다. 이는 조인의 성능에 직접적인 영향을 미친다.

조인의 종류는 쿼리 결과를 결정하는 반면, 조인 메소드는 그 쿼리를 처리하는 방식에 영향을 미친다. 올바른 조인방법을 선택하고, 조인 메소드를 이해함으로써 쿼리 성능을 최적화할 수 있다.

# 결론
Join과 Join Methods는 데이터베이스 쿼리의 성능과 정확성에 중요한 영향을 미친다. 다양한 조인 종류와 그에 따른 조인 메소드를 이해하고 활용하면, 데이터베이스 쿼리의 효율성과 성능을 크게 향상시킬 수 있다.
데이터베이스 설계와 최적화에서 이 두가지 개념을 적절히 활용할 수 있다.