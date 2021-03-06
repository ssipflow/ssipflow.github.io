---
title: \[GO\] 자바 이후 2년간 GO 를 메인으로 사용하며
layout: single
author_profile: true
comments: true
share: true
related: false
date: '2021-04-14'
tags:
    - GO
    - GRPC
    - REVIEW
category: GO
---

2년간 서비스에 GO 와 GRPC 를 사용하며 개인적으로 느낀점에 대해 정리할 필요성을 느꼈다. 오랜만에 작성하는 포스팅

## GO
### JAVA 대비 장점
1. 빠르다.  
    * 자바와 비교하여 JVM 이 없기 때문에 빌드 및 실행을 함에 있어서 가볍다는 인상을 받았다.
    * 컴파일 속도가 빠르다.
2. 직관적이다. 
    * 정의하는 함수에서 하나 이상의 리턴을 할 수 있어 조금 더 직관적인 예외처리가 가능하다. (장점이자 단점)
    * 예약어가 25개로 단순하고, 실용적이다.
3. 효율적인 메모리 리소스 사용
    * 비동기 매커니즘(GoRoutine)을 이용하여 동시성 제공
    * 멀티스레드 매커니즘을 따르며, 경량스레드를 사용한다. (8Kbytes)

### 단점
1. 제너릭을 지원하지 않는다.  
    * 인터페이스를 제너릭처럼 사용할 수 있으나, Type Assertion (타입 캐스팅)을 해줘야 하기 때문에 개발 효율이 떨어진다.
2. 일괄적인 예외처리가 불가능하다.
    * 많은 언어들이 `try-catch` 구문의 `catch` 블록을 통해 예외처리를 하지만 Go 에서는 모든 에러마다 개별의 예외처리를 해줘야 하기 때문에, 개발 효율이 떨어진다. Go 를 처음 접할때 가장 실수가 많이 일어난다.

## GRPC
### 장점
1. JSON 보다 가볍고 빠르다.  
    * gRPC 는 HTTP/2 레이어 위에서 protobuf 를 사용하여 직렬화된 바이트 스트림으로 통신 하므로 JSON 보다 가볍고 빠르다.
2. 정의된 protocol 만으로 문서화가 가능하다.
3. MSA 에 최적화 되어 있다.  
    * gRPC 는 정의한 protocol을 컴파일한 protobuf (stub) 를 호출하여 통신 한다.
    * gRPC 서버에 stub 의 구현체가 존재하며, 이 구현체는 언어의 제약을 받지 않는다. (polyglot 가능)
    
### 단점
1. 런닝커브가 길다.
2. REST API 에 적합하지 않다.  
    * REST API 를 사용하기 위해 grpc-gateway 사용