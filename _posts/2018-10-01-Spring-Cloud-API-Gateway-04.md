---
title: API Gateway (Eureka + ZUUL) 개발기 \#4
layout: single
author_profile: true
comments: true
share: true
related: false
date: '2018-10-01'
tags:
    - Architecture
    - MSA
    - Spring Cloud
category: MSA
---

Eureka는 JAVA 프로젝트로 JVM 어플리케이션에 대해 Service Discovery를 지원한다. MSA는 Polyglot을 지원한다고 했다. Polyglot은 언어에 관계 없이 마이크로서비스로 구성이 가능하다는 것을 의미한다.  

그렇다면 Eureka를 사용할 때 JVM이 아닌 다른 플랫폼의 어플리케이션은 어떻게 Polyglot를 지원할까?  
  
Netflix Eureka 공식문서에서는 Side-car를 이용한다고 한다([링크](https://cloud.spring.io/spring-cloud-netflix/multi/multi__polyglot_support_with_sidecar.html)). 하지만 클러스터는 MESOS/DCOS로, Container Orchestrator는 Marathon을 사용하는 회사 환경에서 Side-car를 사용하지 않고 Polyglot을 지원하는 방법에 대해 고민을 했다. Marathon은 Rest API로 클러스터에 배포되어 있는 인스턴스들의 접속 정보를 가지고 있다. 이 API를 활용하여 Eureka Server에 등록하는 방법으로 Polyglot을 구현했다.  
  
아직 이 방법이 최선인지는 모르겠지만, 어쨌든 잘 동작하고 있으니...  
각설하고 이번 포스팅에서는 Eureka Server에 서비스를 등록하기 위한 데이터 포맷과, Eureka Server Rest API를 중점으로 다룰 예정이다. 시작!

## MESOS/DCOS?