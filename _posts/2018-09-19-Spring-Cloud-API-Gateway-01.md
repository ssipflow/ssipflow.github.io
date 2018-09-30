---
title: API Gateway (Eureka + ZUUL) 개발기 \#1
layout: single
author_profile: true
comments: true
share: true
date: '2018-09-19'
tags:
    - Architecture
    - MSA
    - Spring Cloud
category: MSA
---

Spring Cloud (Spring Boot + Netflix OSS)를 사용한 API GATEWAY 개발기를 작성하기 전에 MSA의 개요와 간단한 특징을 설명하려고 한다. 물론 다른 개발 블로그에서 훨씬 전문적이고, 통찰력 있는 글들도 많지만 API GATEWAY를 개발하면서 개인적으로 느낀 대표적인 특징 몇가지를 포스팅으로 남기려고 한다.


## Micro Service Architecture에 관한 간단한 설명
마이크로서비스란 쉽게말해 캡슐화된 비즈니스 로직이다. Monolithic 구조에서 하나의 프로젝트에 종속되어 있던 비즈니스를 도메인 별로 나누어 별개의 서비스로 운영을 하는것을 의미한다. 이렇게 도메인별로 서비스를 나눌 경우 다음과 같은 이점을 가져갈 수 있다. 


|![Monolitic](/assets/images/static/180919/Monolithic.png){: width="50%" height="50%"}|
|:--:|
|쇼핑몰 Monolithic 구조|

|![MSA](/assets/images/static/180919/MicroServices.png){: width="50%" height="50%"}|
|:--:|
|쇼핑몰 MSA 구조|

## MSA의 대표적인 장점
1. **빌드 및 테스트 시간이 단축된다.**  
기존 Monolithic은 시스템의 규모가 커질수록 빌드/테스트 시간 역시 길어진다. MSA에서는 해당 서비스만 빌드하기 때문에 배포 과정에서 시스템 규모의 영향을 받지 않는다.

2. **서비스간 영향을 받지 않는다.**  
Monolithic에서 특정 컴포넌트에 치명적인 오류가 발생했을 경우 시스템 전체가 중단되는 사태가 발생할 수 있다. 하지만 MSA에서는 해당 서비스만 중단될 뿐 전체 서비스는에는 문제가 발생하지 않는다.

3. **Polyglot 아키텍쳐 지원.**  
MSA는 자율적이고 독립적이므로 각 서비스는 자신만의 고유한 아키텍쳐와 여러 가지 버전의 기술을 적용해서 구축하고 운영할 수 있다. 예를 들면 스케쥴러로 REST call을 하는 크롤러는 메모리 점유가 낮은 Python을 사용하고, API는 Spring+RDB로 개발하여 시스템을 운영할 수있다.

4. **탄력적이고 선택적인 확장.**  
MSA는 필요한 서비스만을 선택하여 확장하는 선택적 확장과 서비스 품질(QoS; Quality of Service)를 구현할 수 있다. 전체 서비스 중 특정 서비스의 부하가 심할 경우 해당 서비스만 Scale In/Out 하여 성능을 높힐 수 있다.


## MSA의 단점
1. **Monolithic에 비해 느린 속도.**  
MSA는 독립적으로 존재하는 서비스 간의 API GATEWAY를 통한 HTTP 통신으로 전체 서비스가 이루어진다. 이러한 구조는 서비스 운영에 안정적이긴 하지만 게이트웨이를 통하지 않는 내부 트랜잭션으로 서비스가 운영되는 Monolithic에 비해 속도가 느릴수 밖에 없다.

2. **관리포인트가 늘어난다.**  
하나의 어플리케이션을 여러개의 서비스로 나누기 때문에 모니터링, 로깅, 인스턴스 관리에 어려움이 있다.


## 마치며
여기까지 MSA에 관한 간단한 설명과 장단점에 대해 작성해 보았다. 사실 서비스를 운영해본 경험이 없어 장단점에 대한 명확한 이해가 부족한게 사실이다. 포스팅에서 작성한 내용들은 개발한 서비스의 프로토타입을 API GATEWAY 개발 후 MSA로 전환하면서 직접 체감한 내용들이다. 아직 부족한 내용들이 많지만 차차 공부해가며 내용을 채워나갈 계획이다.


### Reference
* [스프링 5.0 마이크로 서비스 2/e](https://book.naver.com/bookdb/book_detail.nhn?bid=13270981) - 에이콘 출판사