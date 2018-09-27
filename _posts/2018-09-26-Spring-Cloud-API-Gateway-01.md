---
title: API Gateway (Eureka + ZUUL) 개발기 \#2
layout: single
author_profile: true
comments: true
share: true
date: '2018-09-26'
tags:
    - MSA
    - Spring Cloud
    - Netflix OSS
    - API Gateway
category: MSA
---

## MSA에서 Service Discovery의 필요성
서버의 IP 혹은, 서비스의 엔드포인트가 비교적 정적이였던 시절, 서비스 DNS는 서버 관리자가 직접 관리했다. 하지만 고가용 서비스를 지향하는 클라우드/컨테이너 환경이 보편화 됨에 따라, 휴먼파워로 DNS를 관리하기란 상당히 어려운 일이 되었고 DNS와 엔드포인트를 자동으로 매핑하고 인스턴스를 관리하는 **Service Discovery**의 자동화가 필수요소가 되었다.  
  
Spring Cloud에서는 **Eureka**를 통해 Service Discovery를 지원하는데, 이번 포스팅에서는 Eureka에 대한 설명과 실습을 간략하게 진행할 계획이다.


## Eureka(유레카)에 대한 간단한 설명

처음 Eureka, ZUUL을 시작할 때 [우아한형제들 기술블로그](http://woowabros.github.io/r&d/2017/06/13/apigateway.html) *배민 API GATEWAY - spring cloud zuul 적용기*, [정윤진](http://kerberosj.tistory.com/226)님의 *고가용 서비스* 시리즈를 참고했었다. 정말 전문적이고 잘 정리된 포스팅이였지만 1년차 배경지식이 부족했던 나로써는 몇번을 읽고 나서야 개념에 대한 이해가 가능했다. 그렇게 블로그와 책을 공부하면서 어느정도 이해한 내용들을 기록으로 남긴다.

|![EurekaArchitecuture](/assets/images/static/180926/Eureka_arch.PNG){: width="70%" height="70%"}|
|:--:|
|Eureka의 Server-Client 구조|

1. 유레카는 서버-클라이언트 구조로 이루어져 있다. 서버 컴포넌트는 모든 마이크로 서비스의 가용성을 등록하는 레지스트리다. 등록된 정보는 일반적으로 서비스 ID와 URL이 포함된다. 이렇게 서버 레지스트리에 등록된 서비스는 서비스 ID를 통해 접근할 수 있다.

2. 유레카 클라이언트는 기본적으로 JAVA 어플리케이션이다. Non-JAVA 어플리케이션은 Side-car로 유레카 서비스에 등록하여 Polyglot을 지원한다.

3. 유레카 클라이언트로 등록되면 유레카 서버에서는 30초 간격으로 ping을 요청하여 등록된 서비스의 health를 체크한다. 이 ping 요청이 전송되지 않으면 이 서비스는 죽은것으로 간주하여 레지스트리에서 제외된다.

4. 유레카 클라이언트는 서버로부터 레지스트리 정보를 읽어와 로컬에 캐시한다. 이 후 클라이언트는 로컬에 캐시된 레지스트리 정보를 이용해서 필요한 다른 서비스를 찾을 수 있게된다. 이 정보는 기본적으로 30초마다 주기적으로 갱신되며, 최근에 가져온 정보와 현재 레지스트리 정보의 차이를 가져오는 방식으로 갱신된다.  
**이 특성은 다음 포스팅 예정인 ZUUL에서 가장 중요한 요소이다.**

## Eureka 시작하기
Eureka는 Spring Boot에서 지원하는 프로젝트이다. Maven/Gradle로 직접 라이브러리를 다운받을 수 있고, [Spring Initializr](https://start.spring.io/)에서 프로젝트 생성 후 IDE import를 해도 상관없다.

먼저 [Spring Initializr](https://start.spring.io/)에서 Group, Artifact를 지정한 후, 다음 Dependency를 추가한다.
* Eureka Server
* Actuator

![Initialize](/assets/images/static/180926/spring_initializer.png){:width="70%" height="70%" margin="auto"}