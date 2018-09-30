---
title: API Gateway (Eureka + ZUUL) 개발기 \#2
layout: single
author_profile: true
comments: true
share: true
related: false
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

## Eureka 시작하기 - Eureka Sever
Eureka는 Spring Boot에서 지원하는 프로젝트이다. Maven/Gradle로 직접 라이브러리를 다운받을 수 있고, [Spring Initializr](https://start.spring.io/)에서 프로젝트 생성 후 IDE import를 해도 상관없다.

먼저 [Spring Initializr](https://start.spring.io/)에서 Group, Artifact를 지정한 후, 다음 Dependency를 추가한다. 포스팅에서는 Maven Project로 다운받았다.
* Eureka Server
* Actuator

![Initialize](/assets/images/static/180926/spring_initializer.png){:width="90%" height="90%" margin="auto"}

Generate Project를 하면 Spring Boot Eureka server 프로젝트가 생성되는데 이를 IDE에 import한다.  
이렇게 다운받은 프로젝트는 다음과 같은 디렉토리 구조를 갖는다.  
```
EurekaServer
    |- src
        |- main
            |- java
                |-com.nelson.kim.EurekaServer
                    |- EurekaServerApplication.java
            |- resource
                |- application.properties
    |- pom.xml
```

application.properties 파일에는 유레카 서버에 대한 설정들이 들어간다. MSA에서는 이러한 설정을 Config Server에 둬서 설정이 바뀌어도 서비스의 재시작 없이 설정 적용을 가능하게 하지만 본 포스팅에서는 Config Server를 사용하지 않겠다. 유레카 서버에는 다음과 같은 설정이 들어간다.
```properties
############################################################
################## Application Settings ####################
spring.application.name=Eureka Server
server.port=${PORT:8080}


############################################################
################## Eureka Configuration ####################
eureka.client.serviceUrl.defaultZone=http://localhost:8080/eureka/
eureka.client.register-with-eureka=false
eureka.client.fetch-registry=false
eureka.server.enable-self-preservation=true
```

유레카 서버 설정이 끝나면 메인 클래스인 EurekaServerApplication.java에 ***@EnableEurekaServer*** 어노테이션을 추가한다. 여기서 ***@EnableEurekaServer*** 어노테이션은 해당 어플리케이션이 유레카 서버임을 선언하는것.
```java
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.netflix.eureka.server.EnableEurekaServer;

@EnableEurekaServer
@SpringBootApplication
public class EurekaServerApplication {

	public static void main(String[] args) {
		SpringApplication.run(EurekaServerApplication.class, args);
	}
}
```

이제 Eureka Server 준비는 끝났다. Eureka Server를 실행하면 다음과 같은 웹콘솔을 확인할 수 있다.
![Console](/assets/images/static/180926/Eureka_server_console.png){:width="90%" height="90%" margin="auto"}

## Erueka 시작하기 - Eureka Client
Eureka Server를 만들었으니 이제 유레카 서버에 등록할 유레카 클라이언트를 만들 차례이다. 유레카 서버에 등록되는 클라이언트는 기본적으로 운영에 필요한 서비스이기 때문에 간단한 API를 대상으로 진행하려고 한다.

이번엔 [Spring Initializr](https://start.spring.io/)에서 다음 Dependecy로 프로젝트를 생성한다.
* Eureka Discovery
* Actuator
* Web

![Spring Initializr Client](/assets/images/static/180926/spring_initializer_eureka_client.png)

Eureka Server와 마찬가지로 처음 생성된 프로젝트는 SampleAPIApplication.java만 존재한다. 프로젝트 import 후 application.properties에서 Eureka Client를 위한 설정을 마저 한다.
```properties
############################################################
################## Application Settings ####################

##### 여기서 명시한 어플리케이션 이름이 유레카 서버에 Service ID로 등록된다.
spring.application.name=SampleAPI
server.port=${PORT:8090}

##### Eureka Server의 url이 들어간다.
eureka.client.serviceUrl.defaultZone=http://localhost:8080/eureka/
```

클라이언트의 설정이 끝났으면, Rest API를 위한 SampleController.java를 다음과 같이 생성한다.
```
SampleAPI
    |- src
        |- main
            |- java
                |- com.nelson.kim.SampleAPI
                    |- SampleApplication.java
                |- com.nelson.kim.SampleAPI.controller
                    |- SampleController.java
            |- resource
                |- application.properties
    |- pom.xml
```

```java
@RestController
public class SampleController {

    @RequestMapping(value = "/test", method = RequestMethod.GET)
    ResponseEntity<Map<String, String>> sample() {
        ResponseEntity<Map<String, String>> response = null;

        Map<String, String> resMap = new HashMap<String, String>();
        resMap.put("type", "First eureka client!");
        resMap.put("message", "Spring Cloud is awesome!");

        response = new ResponseEntity<Map<String, String>>(resMap, HttpStatus.OK);

        return response;
    }
}
```

마지막으로 SampleAPIApplication.java에 ***@EnableEurekaClient*** 어노테이션을 추가한다. ***@EnableEurekaClient*** 는 Eureka Client임을 명시하고, .properties에 명시한 유레카 서버에 해당 어플리케이션을 등록한다.

```java
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.netflix.eureka.EnableEurekaClient;

@EnableEurekaClient
@SpringBootApplication
public class SampleApiApplication {

	public static void main(String[] args) {
		SpringApplication.run(SampleApiApplication.class, args);
	}
}
```

API 서비스인 유레카 클라이언트가 완성됐다. 유레카 서버가 실행되어있는 상태에서 SampleAPI를 실행하면 유레카 콘솔에서 다음과 같이 SampleAPI가 등록된 화면을 볼 수 있을것이다. 그리고 [http://localhost:8080/eureka/apps](http://localhost:8080/eureka/apps)에 접근 하면 Eureka Server에 등록된 서비스들의 정보를 xml 형식으로 확인할 수 있다.  

![Eureka Server Registered Console](/assets/images/static/180926/Eureka_server_registered_console.png)


## 마무리
여기까지 Eureka Server에 서비스를 Eureka Client로 등록하여 Service Discovery 하는 방법을 알아보았다. 앞서 이야기 했듯이 Eureka는 JVM 기반 어플리케이션의 Service Discovery를 위한 프로젝트이다. Non-Java 어플리케이션을 유레카 서버에 등록하려면 side-car를 사용하면 된다고 하는데, 나같은 경우는 스케쥴러로 Container Orcherstrator를 크롤링하여 유레카 서버에 등록하는 방법으로 구현해 냈다. 해당 내용은 ZUUL 포스팅 이후 주제로 작성할 예정이다. 다음 글은 Eureka Server에 등록된 서비스들을 위한 API GATEWAY (ZUUL)에 대해 설명할 것이다.
  
  
또한, 유레카 서버와 클라이언트에 대한 더 자세한 설정 옵션들도 많지만 데모는 최대한 기본에 가깝게 만들었다. 더 상세한 설정 옵션은 Netflix Eureka 공식 [docs](https://github.com/Netflix/eureka/wiki/Configuring-Eureka)에서 확인 가능하다.


## Sample Codes
* [Eureka Server](https://github.com/ssipflow/SampleProjects/tree/master/SpringCloud/EurekaServer)
* [SampleAPI (Eureka Client)](https://github.com/ssipflow/SampleProjects/tree/master/SpringCloud/SampleAPI)