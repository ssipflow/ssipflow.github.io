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

## Overview
Eureka는 JAVA 프로젝트로 JVM 어플리케이션에 대해 Service Discovery를 지원한다. MSA는 Polyglot을 지원한다고 했다. Polyglot은 언어에 관계 없이 마이크로서비스로 구성이 가능하다는 것을 의미한다.  

그렇다면 Eureka를 사용할 때 JVM이 아닌 다른 플랫폼의 어플리케이션은 어떻게 Polyglot를 지원할까?  
  
Netflix Eureka 공식문서에서는 Side-car를 이용한다고 한다([링크](https://cloud.spring.io/spring-cloud-netflix/multi/multi__polyglot_support_with_sidecar.html)). 하지만 클러스터는 MESOS/DCOS로, Container Orchestrator는 Marathon을 사용하는 사내 환경에서 Side-car를 사용하지 않고 Polyglot을 지원하는 방법에 대해 고민을 했다. Marathon은 Rest API로 클러스터에 배포되어 있는 인스턴스들의 접속 정보를 가지고 있다. 이 API를 활용하여 Eureka Server에 등록하는 방법으로 Polyglot을 구현했다.  
  
|![customed_eureka_zuul](/assets/images/static/181001/customed_eureka_zuul.PNG)|
|:--:|
|Customed Eureka, ZUUL API GATEWAY|  

아직 이 방법이 최선인지는 모르겠지만, 어쨌든 잘 동작하고 있으니...  
각설하고 이번 포스팅에서는 Eureka Server에 서비스를 등록하기 위한 데이터 포맷과, Eureka Server의 Restful API를 중점으로 다룰 예정이다. 시작!


## Concept 

|![dcos_mesos_marathon](/assets/images/static/181001/dcos_mesos_marathon.png)|
|:--:|
|MESOS DC/OS의 Container 배포|
  
* **Marathon**  
앞서 간략하게 언급했지만 사내 서버는 MESOS Cluster, DC/OS로 구축되어 있다. DC/OS는 도커 이미지를 GUI 또는 CLI로 배포하는데 이 역할은 Container Orchestrator인 Marathon이 수행한다. 즉, 배포된 컨테이너를 Marathon에서 확인할 수 있는데, 이는 REST API로 제공된다.  
[Marathon REST API](http://mesosphere.github.io/marathon/api-console/index.html)  
여기서 **GET: /v2/tasks**를 호출하면 Marthon으로 배포된 전체 서비스를 다음과 같은 JSON 포맷으로 리스트에 담겨 반환한다.
    ```json
    {
        "ipAddresses":[
            {
                "ipAddress":"serverIP",
                "protocol":"IPv4"
            }
        ],
        "stagedAt":"2018-10-02T09:13:59.607Z",
        "state":"TASK_RUNNING",
        "ports":[
            8080
        ],
        "startedAt":"2018-10-02T09:14:15.674Z",
        "version":"2018-10-02T09:13:59.522Z",
        "id":"your-service.7f431de3-c623-11e8-8aa1-aae0d7e58657",
        "appId":"/service-group/your-service",
        "slaveId":"0cab94c8-8cd3-4b12-88cd-16c18a9902bd-S0",
        "host":"hostIP",
        "servicePorts":[
            8081
        ],
        "healthCheckResults":[
            {
                "alive":true,
                "consecutiveFailures":0,
                "firstSuccess":"2018-10-02T09:15:32.809Z",
                "lastFailure":"2018-10-03T10:31:06.694Z",
                "lastSuccess":"2018-10-03T10:31:55.211Z",
                "lastFailureCause":"",
                "instanceId":"your-service.marathon-7f431de3-c623-11e8-8aa1-aae0d7e58657"
            }
        ]
    }
    ```
  
* **Eureka**  
넷플릭스는 친절하게도 Eureka Server의 REST API를 문서로 공개했다.  
[Eureka REST operations](https://github.com/Netflix/eureka/wiki/Eureka-REST-operations)  
여기서 주의할 점은, Spring Cloud로 프로젝트를 생성했을 경우 uri의 **/v2/** 경로를 제거해야 한다. 우리는 Eureka의 Rest api 중 **POST: /eureka/apps/appID**를 사용할 것이다.

* **Eureka Register JSON Format**  
POST: /eureka/apps/appID 로 인스턴스를 등록하기 위해 서비스 정보를 Request Body에 JSON 혹은 XML로 전송해야 한다. Service 인스턴스의 JSON 포맷은 다음과 같다. 
    ```json
    {
        "instance": {
            "app": "등록할 서비스의 이름",
            "instanceId": "독립된 서비스 인스턴스의 id, 접속 endpoint와 관계는 없다",
            "hostName": "인스턴스의 접속 endpoint IP",
            "ipAddr": "인스턴스가 속한 IP address",
            "status": "UP",
            "vipAddress": "ZUUL을 통해 접속할 서비스의 이름, app 필드와 동일한 값을 가져야 한다.",
            "port": {
                "$": "접속 endpoint의 포트 번호",
                "@enabled": "true"
            },
            "dataCenterInfo": {
                "@class": "com.netflix.appinfo.InstanceInfo$DefaultDataCenterInfo",
                "name": "MyOwn"
            },
            "metadata": {
                "management.port": "접속 endpoint의 포트 번호"
            },
            "leaseInfo": {
                "durationInSecs": "인스턴스를 재등록하는 시간 간격"
            }
        }
    }
    ```

즉, 20초 간격으로 Marathon **GET: /v2/tasks**를 호출하여 받은 서비스 정보를 Register JSON Format으로 변환하여 Eureka **POST: /eureka/apps/appID**로 등록하는 방식이다.


## 소스 뜯어보기
그럼 [Customed Eureka and ZUUL](https://github.com/ssipflow/SpringCloudGateway)에서 Eureka Server의 소스를 뜯어보자.

1. **pom.xml**  
기본적으로 Eureka Server를 생성할때와 동일하다. 다만, Marathon REST API로 받아온 JSON을 bean으로 변환하기 위해 GSON이 필요하다.  
    ```xml
    <dependency>
        <groupId>com.google.code.gson</groupId>
        <artifactId>gson</artifactId>
    </dependency>
    ```

2. **application.properties**  
Eureka, Marathon REST API를 변수로 받을수 있도록 자신의 환경에 맞게 다음 설정을 추가한다.  

    ```properties
    marathon.tasks.endpoint=${MARATHON_TASKS_ENDPOINT:marathon-endpoint:v2/tasks}
    eureka.endpoint=${EUREKA_ENDPOINT:eureka-server-endpoint:8770/eureka/apps}
    ```

3. **EurekaServer.java**  
기본 Eureka Server와 다른점이 있다면, 20초 간격으로 크롤링 및 서비스를 등록하는 registerExecutor를 실행한다는 것이다.  

    ```java
    /**
    * Eureka Server
    * @author Nelson Kim
    *
    */
    @EnableEurekaServer
    @SpringBootApplication
    public class EurekaServer {
        
        /**
        * Service Register Using Thread
        */
        @Autowired
        private RegisterExecutor registerExecutor;
        
        @Scheduled(fixedDelay = 1000*20, initialDelay = 1000)
        public void serviceRegister() {
            try {
                registerExecutor.registerExecute();
            } catch (Exception e) {
                // TODO: handle exception
                e.printStackTrace();
            }
        }
        
        public static void main(String[] args) {
            SpringApplication.run(EurekaServer.class, args);
        }
    }
    ```

4. **RegisterExecutor.java**  
이제 REST API를 호출하여 Eureka에 등록하기 위한 서비스를 살펴보자. application.properties에서 설정한 Marathon ,Eureka의 REST API Endpoint를 설정변수로 받아 크롤링 스레드 생성 인자로 전달하고 스레드풀로 크롤링 및 서비스 등록을 실행한다.  

    ```java
    /**
    * Service Registry Executor
    * @author Nelson Kim
    *
    */
    @Service
    @Configuration
    @PropertySource("classpath:application.properties")
    public class RegisterExecutor {

        private final ExecutorService tPool = Executors.newFixedThreadPool(3);

        @Value("${marathon.tasks.endpoint}")
        private String marathon_tasks_endpoint;

        @Value("${eureka.endpoint}")
        private String eurekaUrl;
        
        public void registerExecute(){
            RegisterTask registerTask = new RegisterTask(marathon_tasks_endpoint, eurekaUrl);
            tPool.execute(registerTask);
        }
    }
    ```

5. **RegisterTask.java**  
마지막으로 RegisterExecutor에서 실행하는 스레드인 RegisterTask.java를 살펴보자. RegisterTask.java는 Marathon task들의 정보를 Eureka 등록 포맷으로 변환하여 Eureka에 등록하는 서비스 로직이다. REST API를 위한 bean은 미리 구성해 두었다.  
여기서 주의할점에 대해 알아보자

    * leaseInfo의 durationInSecs을 30으로 지정하여 30초 간격으로 서비스를 확인하여 죽었을 경우 Eureka에서 삭제하도록 설정  

        ```java
        leaseInfo.put("durationInSecs", "30");
        ```

    * Marathon appID에 그룹명이 포함되어 있는 경우 서비스 ID에 group 명을 포함  

        ```java
        String[] dummy = task.getAppId().split("/");
        String app = "";
        String name = dummy[dummy.length - 1];

        String prefix = "";
        if (dummy.length > 2) {
            for (int i = 0; i < dummy.length - 1; i++)
                prefix = dummy[i] + "_";
        }
        name = prefix + name;
        ```

    * Eureka에 등록된 서비스의 접속 Endpoint는 hostName, port 에서 결정  
    
        ```java
        register.setHostName(hostName);
        .
        .
        .
        for (int i = 0; i < task.getPorts().size(); i++) {
            port.put("$", Integer.toString(task.getPorts().get(i)));
            port.put("@enabled", "true");
            metadata.put("management.port", Integer.toString(task.getPorts().get(i)));

            register.setMetadata(metadata);
            register.setPort(port);
            register.setInstanceId(hostName + ":" + task.getPorts().get(i));
            register.setLeaseInfo(leaseInfo);

            instance.setInstance(register);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            String reqBody = Util.beanToJson(instance);

            restTemplate.exchange(eurekaEndpoint+name, HttpMethod.POST, new HttpEntity<String>(reqBody, headers), String.class);
        }
        ```

 이제 Eureka Client, Side-car가 필요없는 Eureka Server가 완성됐다. Docker로 빌드하여 DC/OS에 배포하면 다음과 같이 Eureka Client 없이 서비스들이 등록된 Eureka Server를 확인할 수 있을것이다.

|![custome_eureka_console](/assets/images/static/181001/customed_eureka_console.png)|
|:--:|
|Customed Eureka console|  


## 정리
이번 포스팅을 마지막으로 Eureka, ZUUL을 이용한 API GATEWAY 개발기가 끝났다. 이번 포스팅은 DC/OS, MESOS, Marathon, Eureka API 포맷, 로직 등 정리할 내용이 많았다. 하지만 클러스터, Container Orchestration은 각각의 내용만으로 시리즈를 구성해야할 만큼 정리해야할 내용이 많아 글의 구성이 만족스럽지 않다.  
  
글만 보면 정신없지만 오늘 정리한 Customed Eureka Server의 구성은 매우 간단하다. Container Orchestrator를 사용중이면 Orchestrator를 크롤링하여 Eureka에 등록하는것. 이게 전부다. 중요한것은 Eureka Register Format을 정확히 맞춰주는것. 만약 MESOS + Marathon이 아닌 Kubernetes를 사용중이라면 kubernetes apiserver에서 POD 정보를 가져와 Eureka Server에 등록하면 된다.


## Sample Codes
* [SpringCloudGateway](https://github.com/ssipflow/SpringCloudGateway)

## API Gateway (Eureka + ZUUL) 개발기
* [API Gateway (Eureka + ZUUl) 개발기 \#1](https://ssipflow.github.io/msa/Spring-Cloud-API-Gateway-01/)
* [API Gateway (Eureka + ZUUl) 개발기 \#2](https://ssipflow.github.io/msa/Spring-Cloud-API-Gateway-02/)
* [API Gateway (Eureka + ZUUl) 개발기 \#3](https://ssipflow.github.io/msa/Spring-Cloud-API-Gateway-03/)
* [API Gateway (Eureka + ZUUl) 개발기 \#4](https://ssipflow.github.io/msa/Spring-Cloud-API-Gateway-04/)