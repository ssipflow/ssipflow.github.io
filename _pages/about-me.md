---
layout: single
permalink: /about-me/
title: "About"
author_profile: true
comments: false
---
## 김 명 균 (Nelson Kim)
E-MAIL: [ssipflow@gmail.com](mailto:ssipflow@gmail.com)  
GitHub: [https://github.com/ssipflow](https://github.com/ssipflow)  
    
막 4년차에 접어든 주니어 개발자.  
근본, 성능, 가독성을 중요하게 여기는 개발자.
늘 발전을 원하는 개발자.

## Education
* 인하대학교 \| 2013.03 - 2016.02
    * 컴퓨터정보공학과 학사 졸업
    * 네트워크, 운영체제, 유닉스시스템프로그래밍, 데이터베이스, 알고리즘, 객체지향프로그래밍, 자바프로그래밍, 웹프로그래밍 등 이수

* 백석대학교 \| 2007.03 - 2013.02
    * 소프트웨어공학과 중퇴 -> 인하대학교 컴퓨터정보공학과 편입
    * C언어프로그래밍, 자료구조, 소프트웨어공학 등 이수

## Skill Set
* Language : GO, JAVA, Python, C/C++, JS
* Framework : Spring Boot, Clean Architecture, jQuery
* DB : MySQL, InfluxDB, Redis, PostgreSQL
* ETC : GRPC, Kubernetes, MESOS, DC/OS, Docker, Docker Swarm, Netflix OSS, CentOS

## Career & Experience
* Sentbe \| Back-End Developer \| 2019.02.11 - 현재
    * Sentbe PG \| Back-End Developer \| 2020.12 - 현재
        * 가맹점, 어드민 대시보드 및 정산시스템 설계
        * 결제내역 대시보드 API 개발
    * Sentbiz B2B \| Back-End Developer |\ 2019.12 - 현재 
        * 
* NexCloud \| Back-End Developer \| 2017.10.10 - 2019.01.31
    * Mesos Crawling Agent \| 2018.05 - 2018.06
        * Docker 기반 DC/OS, MESOS 모니터링 서비스인 NexClipper의 Agent 개발
        * REST 방식으로 Mesos API를 크롤링하여 Metrics 데이터 수집
        * JAVA, Docker

    *  NexClipper Oauth Service \| 2018.05 - 2018.05
        * JWT 인증 서비스 개발
        * API Gateway와 연동하여 JWT 토큰 유효성 검증 및 업데이트
        * Spring Boot, JWT, Docker

    * NexClipper API Service \| 2018.02 - 2018.09
        * NexClipper 프로토타입에서 DB에 직접 접근하던 Buisness 로직을 API로 분류
        * MySQL, InfluxDB, Redis 등에 접근하여 Mesos, Kubernetes Metrics 반환
        * Spring Boot, Swagger, Docker

    * NexClipper MSA 전환 \| 2018.02 - 2018.04
        * NexClipper 프로토타입을  Micro Service Architecture로 전환
        * API Gateway (Eureka + ZUUL) 개발 후, DDD에 입각하여 수집한 데이터 종류 및 기능에 따라 Mesos API, Search API, Oauth Service 등으로 분할
        * Spring Cloud (Spring Boot + Netflix OSS), Docker

    * NexClipper API Gateway \| 2018.02 - 2018.04
        * Micro Service Architecture를 위한 API Gateway 개발
        * Mesos, Marathon 환경에서 사용
        * Netflix OSS인 ZUUL과 Eureka를 커스터마이징하여 Side-car 및 Eureka Client가 필요 없는 마이크로서비스 polyglot 지원
        * Spirng Cloud (Spring Boot + Netflix OSS)
        * [https://github.com/NexClipper/NexGate](https://github.com/NexClipper/NexGate)

    * NexClipper 프로토타입 \| 2017.11 - 2018.02
        * Mesos, DC/OS 클러스터 및 서비스를 모니터링 하는 솔루션 NexClipper의 프로토타입 개발
        * InfluxDB, Redis, MySQL에 수집된 데이터를 조회하는 기능 구현
        * Spring Boot, Docker

* 한국철도기술연구원 \| 산학현장실습 인턴 \| 2015.07 - 2015.08
    * 시뮬레이션 프로그램 코드 분석 \| 2015.07 - 2015.08  
    미니트램 주행시뮬레이션 프로그램 (Python) 코드 분석 및 연구개발에 활용할 프로그램 명세서 작성

## Toy Project
* Dia Fit \| 2017.05 - 2017.06
    * 헬스장 PT 관리 시스템
    * Spring Framework 스터디 목적
    * Open API를 이용하기 보다 직접 기능을 구현하는것에 목적을 둠
    * AJAX 비동기 통신을 이용하여 Single Page Application 구현
    * Spring Web Socket을 통한 TCP/IP 메신저 기능 구현
    * [https://github.com/ssipflow/DiaFit](https://github.com/ssipflow/DiaFit)

* Style Follow \| 2017.02 - 2017.03
    * 패션 추천 플랫폼
    * Servlet/JSP MVC 모델 이해가 목적
    * HTML5 geolocation 객체로 현재 위치 좌표 확인
    * OpenWeatherMap API를 이용하여 현재 좌표의 날씨 정보 확인
    * 추천 수 및 사전에 지정한 관심 스타일에 따라 포스팅을 보여주는 쿼리문 적용
    * AJAX 비동기 통신을 활용하여 Single Page Application 구현
    * 비동기 통신으로 스크롤 로딩을 구현하여 UI/UX 편의성 제공
    * [https://github.com/ssipflow/StyleFollow](https://github.com/ssipflow/StyleFollow)

* Smart Cycle \| 2015.09 - 2015.12
    * 인하대학교 학내 캡스톤 설계
    * 실내 자전거를 운동이 아닌 게임으로 체험하기 위한것이 목표
    * 자전거 속도를 측정하기 위한 Arduino 센서 개발
    * AWS, PHP, MySQL 데이터베이스 서버 개발
    * IoT를 활용한 프로젝트로써 데모시연 초반 좋은 반응을 얻었지만, 시연 중 발경하지 못한 버그가 발생하여 아쉬움으로 남은 프로젝트
    * 플레이 영상 - [https://youtu.be/9MjocXsIAJY](https://youtu.be/9MjocXsIAJY)
    * 플레이 화면 - [https://youtu.be/2WeWuNyNaus](https://youtu.be/2WeWuNyNaus)
    * [https://github.com/ssipflow/SmartCycle](https://github.com/ssipflow/SmartCycle)
