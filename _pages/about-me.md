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
    
* 핀테크, 블록체인 백엔드 개발자.
* 근본, 성능, 가독성을 중요하게 여기는 개발자.
* 늘 발전을 원하는 개발자.

## Education
* 인하대학교 \| 2013.03 - 2016.02
    * 컴퓨터정보공학과 학사 졸업
    * 네트워크, 운영체제, 유닉스시스템프로그래밍, 데이터베이스, 알고리즘, 객체지향프로그래밍, 자바프로그래밍, 웹프로그래밍 등 이수

* 백석대학교 \| 2007.03 - 2013.02
    * 소프트웨어공학과 중퇴 -> 인하대학교 컴퓨터정보공학과 편입
    * C언어프로그래밍, 자료구조, 소프트웨어공학 등 이수

## Skill Set
* Language : GO, JAVA, JavaScript, TypeScript, Python, C/C++
* Framework : Spring Boot, Clean Architecture, Nest.js, Node.js
* DB : MySQL, InfluxDB, Redis, PostgreSQL
* ETC : GRPC, Kubernetes, MESOS, DC/OS, Docker, Docker Swarm, Netflix OSS, CentOS

## Career & Experience
* Ozys \| BlockChain Back-End Developer \| 2022.04 - 2023.12
    * InterChain 모니터링 시스템 개발 \| Back-End Developer \| 2022.09 - 2023.12
        * EVM ViewContract를 호출하여 InterChain 노드 운영 현황 데이터 수집
        * 노드 운영 현황 metric 가공 및 API 제공

    * 사내 컨텐츠 운영서비스 개발 및 운영 \| Full Stack Developer \| 2022.07 - 2023.12
        * 오지스 운영 Front-End 서비스를 위한 컨텐츠 생산 및 관리 툴
        * Secure coding 으로 ISMS 인증

    * 재무모니터링 시스템 개발 및 운영 \| Back-End Developer \| 2022.04 - 2023.12
        * 자금운영 현황 파악을 위한 Cron 및 API 서비스
        * 기존 React 에서 직접 지갑 주소를 호출하여 생성하는 회계 데이터 자동화
        * Front-End 비즈니스 로직을 서버로직으로 변경
        * 코드 가독성 유지보수성을 높이기 위해 NestJS 도입
        * Caver, EVM Client를 사내 자금 운용중인 DeFi 상품별 ViewContract 호출 및 데이터 가공
        * Clean Architecture 도입
        * Klayswap, Meshswap 상품별 현황 모니터링
        * DeFi 토큰 종가 데이터 수집

* Sentbe \| FinTech Back-End Developer \| 2019.02.11 - 현재
    * Sentbe PG 백소피스 API 개발 \| Back-End Developer \| 2021.12 - 2022.03
        * PG 서비스 관리자 백오피스 API 개발

    * Sentbe FDS \| Back-End Developer \| 2021.10 - 2021.11
        * 부정거래 탐지시스템 API (Fraud Detection System) API 개발 및 운영
        * 결제내역 대시보드 API 개발

    * Sentbiz B2B 해외송금 서비스\| Back-End Developer \| 2019.11 - 2022.03
        * B2B 해외송금 서비스 개발 및 운영
        * Clean Architecture 적용 -> 가독성, 서비스 의존성 개선
        * 설계일정 단축 및 비개발 담당자와의 커뮤니케이션 향상
        * 비동기 메세지 큐 개발 -> Batch Process 에 비하여 안정적인 메세지 큐 운영
        * 법인 기업 가입 기능 개발 -> 기업 가입 절차 개선
        * KRW wallet 구축 -> 기업 자금 관리 업무 개선
        * 회계자료, 한국은행 보고서 등 백오피스 기능 개발
        * 폐쇄망 서비스 운영환경 구축
        * Go, GRPC, Postgres, Redis, Vault, Minio, CentOS

    * Sentbe B2C 해외송금 서비스 \| Back-End Developer \| 2019.02 - 2021.01
        * B2C 해외송금 서비스 개발 및 운영
        * 자사 해외송금 API 연동
        * SMS / 알림톡 알림 서비스 개발
        * Batch Process 개발 -> 실시간 송금상태 추적
        * 회계자료, 한국은행 보고서 등 백오피스 기능 개발
        * Docker Swarm, Vault, Redis 등 운영환경 구축
        * Go, GRPC, Postgres, Redis, Vault, Minio, CentOS

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
        * Spring Cloud (Spring Boot + Netflix OSS)
        * [https://github.com/NexClipper/NexGate](https://github.com/NexClipper/NexGate)

    * NexClipper 프로토타입 \| 2017.11 - 2018.02
        * Mesos, DC/OS 클러스터 및 서비스를 모니터링 하는 솔루션 NexClipper의 프로토타입 개발
        * InfluxDB, Redis, MySQL에 수집된 데이터를 조회하는 기능 구현
        * Spring Boot, Docker

* 한국철도기술연구원 \| 산학현장실습 인턴 \| 2015.07 - 2015.08
    * 시뮬레이션 프로그램 코드 분석 \| 2015.07 - 2015.08  
    미니트램 주행시뮬레이션 프로그램 (Python) 코드 분석 및 연구개발에 활용할 프로그램 명세서 작성