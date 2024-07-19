---
title: \[Clean Architecture \#2\] Clean Architecture with Spring Boot
layout: single
author_profile: true
comments: true
share: true
related: false
date: '2024-07-20'
tags:
    - Design Pattern
    - Clean Architecture
    - SOLID
    - Spring Boot
category: Clean Architecture
timezone: Asia/Seoul
---

# Spring Boot와 Clean Architecture
Spring Boot의 3-Tier 아키텍처와 Clean Architecture는 소프트웨어 설계에서 계층화를 통해 코드의 유지보수성과 확장성을 높이는 것을 목표로 한다.
두 아키텍처 모두 명확한 계층 분리를 통해 책임을 분리하고, 의존성을 관리하여 시스템의 유연성을 확보한다.
이 두 아키텍처의 각 계층은 다음과 같은 유사성을 가지고 있다.

1. Presentation layer(Controller)와 Interface Adapters
    * 두 계층 모두 사용자의 요청을 처리하고, 이를 비즈니스 로직 계층에 전달한 후, 그 결과를 다시 사용자에게 반환하는 역할을 한다.
    * 외부와의 인터페이스를 담당하며, 데이터의 형식을 변환하여 내부 시스템이 쉽게 처리할 수 있도록 한다.
2. Business Logic Layer(Service)와 UseCases
    * 두 계층 모두 애플리케이션의 비즈니스 로직을 처리하는 역할을 한다
    * 핵심 비즈니스 규칙을 정의하고, 이를 실행하여 애플리케이션의 주요 기능을 구현한다.
3. Data Access Layer(Repository)와 Frameworks and Drivers
    * 두 계층 모두 데이터를 저장하고, 불러오는 역할을 담당한다.
    * 데이터베이스와의 상호작용을 통해 영속성을 관리한다.

3-Tier 아키텍처는 많은 프레임워크와 애플리케이션에서 널리 사용되는 구조이다. 이를 적절히 활용하여 Clean Architecture 설계가 가능한데, 이번 포스팅에서 Spring Boot로 Clean Architecture를 구현해 볼 것이다.


## 프로젝트 구조
```
src/main/java/com/example/cleanarchitecture
    ├── controller
    │   └── model
    │       └── UserDtoImpl.java
    │   └── UserController.java
    ├── service
    │   ├── UserService.java
    │   └── domain
    │       └── User.java
    ├── repository
    │   └── UserRepository.java
    │   └── UserRepositoryImpl.java
    │   └── model
    │       └── UserDtoImpl.java
    ├── dto
    │   └── UserDto.java
    ├── entities
    │   └── UserEntity.java
    └── CleanArchitectureApplication.java
```

## 0. DTO
DTO (Data Transfer Object)는 계층 간의 의존성을 줄이기 위해 사용된다. DTO를 인터페이스로 정의하고, 이를 구현하는 클래스를 각 계층에 작성한다.
```java
// src/main/java/com/example/cleanarchitecture/dto/UserDto.java
package com.example.cleanarchitecture.dto;

public interface UserDto {
    Long getId();
    String getName();
    String getEmail();
}
```

## 1. Presentation Layer(Interface Adapter) - Controller
Presentation Layer는 사용자의 요청을 받아 Business Logic Layer로 전달하는 역할을 한다. 여기서는 `UserController`를 정의한다.

### Controller
```java
// src/main/java/com/example/cleanarchitecture/controller/UserController.java
package com.example.cleanarchitecture.controller;

import com.example.cleanarchitecture.service.UserService;
import com.example.cleanarchitecture.dto.UserDto;
import com.example.cleanarchitecture.controller.model.UserDtoImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {
    private final UserService userService;

    @GetMapping
    public ResponseEntity<List<UserDto>> getAllUsers() {
        List<UserDto> userDtos = userService.getAllUsers();
        return ResponseEntity.ok(userDtos);
    }

    @PostMapping
    public ResponseEntity<UserDto> createUser(@RequestBody UserDtoImpl userDto) {
        UserDto createdUserDto = userService.createUser(userDto);
        return ResponseEntity.ok(createdUserDto);
    }
}
```

### Model
Controller 에서 사용할 DTO 객체
```java
// src/main/java/com/example/cleanarchitecture/controller/model/UserDtoImpl.java
package com.example.cleanarchitecture.controller.model;

import com.example.cleanarchitecture.dto.UserDto;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserDtoImpl implements UserDto {
    private Long id;
    private String name;
    private String email;
}
```

## 2. Business Logic(UseCase) Layer - Service
Business Logic(UseCase) Layer는 애플리케이션의 비즈니스 로직을 처리한다. 여기서는 UserService와 User 도메인 객체를 정의한다.

### Service
```java
// src/main/java/com/example/cleanarchitecture/service/UserService.java
package com.example.cleanarchitecture.service;

import com.example.cleanarchitecture.dto.UserDto;
import com.example.cleanarchitecture.repository.UserRepository;
import com.example.cleanarchitecture.service.domain.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository;

    public List<UserDto> getAllUsers() {
        return userRepository.findAll().stream()
                .map(user -> new User(user.getId(), user.getName(), user.getEmail()))
                .collect(Collectors.toList());
    }

    public User createUser(User userDto) {
        return (User) userRepository.save(userDto);
    }
}
```

### Domain
UseCases 에서 사용할 DTO(Entity 혹은 Domain)
```java
// src/main/java/com/example/cleanarchitecture/service/domain/User.java
package com.example.cleanarchitecture.service.domain;

import com.example.cleanarchitecture.dto.UserDto;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class User implements UserDto {
    private Long id;
    private String name;
    private String email;

    public void updateEmail(String newEmail) {
        this.email = newEmail;
    }

    @Override
    public Long getId() {
        return id;
    }

    @Override
    public String getName() {
        return name;
    }

    @Override
    public String getEmail() {
        return email;
    }
}
```

## 3. Data Access(Framework and Drivers) Layer - Repository
Data Access Layer(Framework Drivers) Layer는 데이터베이스와 항호작용을 담당한다. 여기서는 `UserRepository` 인터페이스와 구현체를 정의한다.

### Repository
```java
// src/main/java/com/example/cleanarchitecture/repository/UserRepository.java
package com.example.cleanarchitecture.repository;

import com.example.cleanarchitecture.dto.UserDto;
import java.util.List;

public interface UserRepository {
    List<UserDto> findAll();
    UserDto save(UserDto userDto);
}
```

### Repository Implementation
```java
// src/main/java/com/example/cleanarchitecture/repository/UserRepositoryImpl.java
package com.example.cleanarchitecture.repository;

import com.example.cleanarchitecture.dto.UserDto;
import com.example.cleanarchitecture.entities.UserEntity;
import com.example.cleanarchitecture.repository.model.UserDtoImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;
import java.util.List;
import java.util.stream.Collectors;

@Repository
@RequiredArgsConstructor
public class UserRepositoryImpl implements UserRepository {
    @PersistenceContext
    private EntityManager entityManager;

    @Override
    public List<UserDto> findAll() {
        List<UserEntity> userEntities = entityManager.createQuery("FROM UserEntity", UserEntity.class).getResultList();
        return userEntities.stream()
                .map(entity -> new UserDtoImpl(entity.getId(), entity.getName(), entity.getEmail()))
                .collect(Collectors.toList());
    }

    @Override
    public UserDto save(UserDto userDto) {
        UserEntity userEntity = new UserEntity(userDto.getId(), userDto.getName(), userDto.getEmail());
        if (userEntity.getId() == null) {
            entityManager.persist(userEntity);
        } else {
            userEntity = entityManager.merge(userEntity);
        }
        return new UserDtoImpl(userEntity.getId(), userEntity.getName(), userEntity.getEmail());
    }
}
```

### Model
Repository에서 사용할 DTO
```java
// src/main/java/com/example/cleanarchitecture/repository/model/UserDtoImpl.java
package com.example.cleanarchitecture.repository.model;

import com.example.cleanarchitecture.dto.UserDto;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserDtoImpl implements UserDto {
    private Long id;
    private String name;
    private String email;
}
```

## 5. JPA Entity
JPA Entity 는 데이터베이스와의 상호작용을 위해 사용된다.
```java
// src/main/java/com/example/cleanarchitecture/entities/UserEntity.java
package com.example.cleanarchitecture.entities;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    private String email;
}
```

# 결론
위의 예제는 3-Tier 아키텍처를 유지하면서 Clean Architecture의 원칙을 적용한 것이다.
**각 계층의 책임을 명확히 하고, DTO 인터페이스를 사용하여 계층간의 의존성을 최소화** 하였다. 이를 통해 코드의 유지보수성과 확장성을 높일 수 있다.

DTO 를 사용하여 계층 간의 데이터를 주고받으며, 서비스 계층은 도메인 객체를 사용하고, 컨트롤러는 DTO를 사용하여 비즈니스 로직을 처리한다.
중요한 점은 Service(UseCase) 계층이 Repository(Framework and Drivers) 계층에 의존하지만, **추상화된 인터페이스에 의존하여 DIP(Dependency Inversion Principle)를 지향했다는 것**이다.
이를 통해 고수준 모듈이 저수준 모듈에 의존하지 않고, 변경에 유연하게 대응할 수 있는 구조를 유지할 수 있다.

Clean Architecture는 복잡한 시스템을 모듈화하고, 변경에 유연하게 대응할 수 있도록 돕는 강력한 아키텍처 패턴이다. Spring Boot와 함께 사용하여 시스템의 이해도와 관리 효율성을 크게 향상시킬 수 있다.