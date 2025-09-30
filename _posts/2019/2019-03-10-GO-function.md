---
title: "[GO] 함수에 대하여 #1"
layout: single
author_profile: true
comments: true
share: true
related: true
date: '2019-03-10'
tags:
    - Language
    - GO
    - Study
category: GO
---

마지막 포스팅 이후 오랜 시간이 지났다. 작년 10월, 경력 1년을 찍는 순간 그동안 계획했던 이직활동을 본격적으로 시작했다. 이력서를 정리하고 여러 회사에 지원하면서 자연스럽게 블로그 포스팅을 못하게 되었다. 물론 올해 2월에 그토록 원하던 이직에 성공했고 새로운 회사에 적응중이다. 지금 회사는 GO 언어를 사용하고 있다. MSA를 시작하면서 수도없이 들어온 언어고 언젠가 기회가 된다면 배워보고 싶은 언어였는데 그 시기가 생각보다 빨리 찾아왔다. 현 회사에서는 주1회 'Discovery GO' 책을 가지고 스터디를 진행하고 있다. 그간 세개 챕터의 스터디를 진행하면서 따로 기록으로 남기지 않았는데 이러한 습관들이 나에게 큰 도움이 되지 않는다는 생각이 들어 이번 회차부터라도 글로 남겨보려고 한다. 이번 포스팅은 이번 스터디의 주제인 go 함수에 대해 정리할 예정이다. 

# 함수란?
코드의 큰 덩어리를 만든 다음 그것을 호출하고 귀환할 수 있는 구조를 서브루틴이라고 부른다. 서브루틴은 복잡한 코드를 관리 할 수 있게 해주는 첫걸음이다. 서브루틴으로 코드를 구성하여 중복된 코드를 줄이고, 추상화하고 단순화 할 수 있다. 이미 다른언어와 마찬가지로 이러한 서브루틴을 함수라 지칭한다. 다른 언어에서는 서브프로그램, 프로시저, 메서드, 호출가능 객체 등 여러가지 이름으로 불린다.

내부적으로 서브루틴은 주로 스택으로 구현한다. **일반적으로 호출이 이루어지면 스택에 현재 Program Counter(PC)와 넘겨줄 인자들을 넣은 뒤에 프로그램 카운터의 값을 변경하여 호출될 서브루틴 주소로 건너뛴다.** 여기서 다시 다른 함수로 호출이 일어나고 또 다시 호출이 일어나더라도 스택을 따라가면 다시 원래 있던 주소로 돌아올 수 있다. 함수는 이런식으로 호출되기 때문에 재귀호출을 이용한 프로그래밍이 가능하다.

Go 언어는 **값에 의한 호출 (Call by value) 만을 지원**한다. 함수 내에서 넘겨받은 변수값을 변경하더라도 함수 밖의 변수에는 영향을 주지 않는다. 따라서 함수 밖의 변수의 값을 변경하려면 **해당 값이 들어있는 주소값을 넘겨받아, 그 주소에 있는 값을 변경하여 참조에 의한 호출 (Call by reference)을** 비슷하게 구현할 수 있다.

# 값 넘겨주고 넘겨받기
다른 언어와 마찬가지로 서브루틴에 값을 전달할 수 있고, 함수의 결과 값을 받아 다시 사용할 수도 있다. 이번장에서는 GO에서 함수를 구현할 때 특이하게 값을 주고 받을 수 있는 방법에 대해 알아보자.

## 값 넘겨주기
참조에 의한 호출 (Call by reference)에 대해 잘못된 명칭이다 하는 의견이 많지만 우선 편의를 위해 Call by reference 용어를 사용하는것에 대해 미리 양해를 구한다.  
다음은 Call by reference, Call by value 의 차이점을 보여주는 예제이다. 샘플코드를 확인해보자.
```go
func CallByValue(num int) {
	num++
}

func CallByReference(num *int) {
	*num++
}

func main() {
    i := 3
    
    CallByValue(i)
    fmt.Println(i)  // 3
    
    CallByReference(&i)
    fmt.Println(i)  // 4
}
```

* CallByValue는 전달받은 i의 값이 함수의 인자 num에 복사된다. 그래서 main 함수의 i가 아닌 CallByValue 함수 안에서만 값이 변경된다.
* CallByReference는 전달받은 i의 주소가 가리키는 값을 변경한다. 함수 외부의 값을 변경할 수 있다.

물론 모든 자료형이 Call by value를 사용하는 것이 아니다. slice의 경우 기본적으로 Call by reference 를 사용하며. map의 경우 key를 이용해 Call by reference 처럼 사용할 수 있다. (추후 p.114의 그림을 삽입)

```go
func SliceAddOne(s []int) {
    for i := range s {
        s[i]++
    }
}

func MapAddOne(m map[int]int) {
    for k, _ := range m {
        m[k]++
    }
    
    /*
    for _, v := range m {
        v++
        // 이 경우 m의 주소값이 가리키는 이 변하지 않는다.
    }
    */
}

func main() {
    n := []int{1, 2, 3, 4}
    SliceAddOne(n)
    fmt.Println(n)	// [2 3 4 5]

    m := map[int]int{
        1: 1,
        2: 2,
        3: 3,
        4: 4,
        5: 5,
	}
    MapAddOne(m)
    fmt.Println(m)	// map[1:2 2:3 3:4 4:5 5:6]
}

```

## 둘 이상의 반환값
GO의 함수는 특이하게 둘 이상의 반환값을 둘 수 있다. 위 예제에서 ```for k, _ := range m``` 을 사용할 수 있었던 이유는 둘 이상의 반환값을 둘 수 있기 떄문이다. 일반적으로 에러값을 반환할 때 많이 사용하고, 둘 이상의 값을 반환할 때는 반환 타입을 괄호로 둘러싼다.

```go 
func WriteTo(w io.Writer, lines []strings) err { ... return err }
func WriteTo(w io.Writer, lines []strings) (int64, err) { ... return n, err }
```

앞서 본 샘플에서 확인할 수 있듯이 둘 이상의 반환값이 있을 때, 필요없는 변수의 경우 언더바( _ )를 이용하면 된다.

```go
_, err := WriteTo(w, lines)
```

### 에러값 주고받기
리턴 값이 하나뿐인 언어에서는 에러값을 주고받기 위해 에러 별 코드를 지정하여 그 코드를 리턴하는 방법을 주로 사용하였다. GO에서는 둘 이상의 값을 반환할 수 있기 때문에 여러 반환값 중 마지막 값에 에러를 반환한다. 물론 다른 언어들의 예외(exception)와 비슷한 패닉 (panic) 이란 개념이 있어, 보통 예외를 던지면 호출 스택을 따라 호출 역순으로 따라가며 이 예외를 처리할 코드를 찾는다. 하지만 panic은 일반적인 에러 상황에서 쓰이기 보다는 심각한 에러 상황에서 사용한다. GO는 다음과 같은 방식으로 예외를 처리하면서 에러를 반환할 수 있다.

```go
func Sample() (int, error) {
    if err := MyFunc(); err != nil {
        ...
        return nil, err
    }
    ...
}
```

새로운 에러를 생성해야 하는 경우에는 가장 간단한 방법으로 ```errors.New``` 와 ```fmt.Errorf``` 를 이용하여 문자열 메시지를 줄 수 있다. 대부분 문자열 메시지는 로그 등으로 출력되는데, 메시지만으로는 어디서 발생한 에러인지 알기 어렵기 때문에 반드시 문맥을 알기 쉽게 작성한다. 아래 예시는 ```stringlist.ReadFrom``` 함수에서 줄이 너무 길어서 발생한 에러임을 알 수 있다.

```go
return erros.New("stringlist.ReadFrom: line is too long")

// 다른 부가 정보를 추가한 메시지를 돌려줄 수 있다.
// 다음은 몇 번쨰 줄이 너무 긴지, 에러 메시지를 포함한다.
return fmt.Errorf("stringlist: too long line at %d", count)
```

## 명명된 결과 인자
대부분의 언어들은 리턴값을 자료형으로만 사용한다. 그러나 GO는 리턴값 역시 인자처럼 값을 지정할 수 있다. 이러한 경우 리턴값은 자료형의 기본값으로 초기화 (정수면 0, 문자열이면 빈 문자열로 초기화) 된다.

반환할 떄는 기존 방식대로 ```return``` 뒤에 쉼표로 구분하여 리턴 값을 나열할 수도 있고, 생략하고 ```return`` 만 쓸 수 있다. 

```go
func MultiReturnSample() (msg1, msg2 string) {
    msg1 = "Hello"
    msg2 = "World"
    return
}

func main() {
    m1, m2 := MultiReturnSample()
    fmt.Println(m1, m2)	// Hello World
}
```

리턴값을 생략할 경우 코드 가독서이 좋지가 않은 경우도 발생하기 떄문에 상황에 따라 사용하도록 하자.

## 가변인자
개수가 정해져 있지 않은 자료형이 같은 인자를 함수에 전달할 때는 가변인자를 사용한다. 물론 인자의 자료형을 슬라이스로 지정해도 되지만 이 경우 슬라이스만을 인자로 받기 때문에 가변인자가 좀 더 간편한 방법이다.

```go
func SliceParams(nums []int) {
    fmt.Println("slice parameter")
    for _, num := range nums {
        fmt.Print(num, " ")
    }
    fmt.Println()
}

func VariableParams(nums ...int) {
    fmt.Println("variable parameter")
    for _, num := range nums {
        fmt.Print(num, " ")
    }
    fmt.Println()
}

func main() {
    nums := []int{1, 2, 3, 4, 5}

    SliceParams([]int{1, 2, 3, 4, 5})	
    VariableParams(1, 2, 3, 4, 5)

    // 슬라이스 하나를 넘기면 그 슬라이스 하나를 담고 있는 슬라이스로 만들어 넘겨주기 때문에 점 셋을 붙여 슬라이스를 가변인자로 전달 가능 하다.
    VariableParams(nums...)
}
```

# 값으로 취급되는 함수
GO 언어에서 함수는 일급 시민 (First-class citizen)으로 분류되어 함수를 값으로써 변수에 담을 수 있고 다른 함수로 넘기거나 돌려받을 수 있다.

## 함수 리터럴
이름이 없는 순수한 함수의 값을 함수 리터럴(Function literal) 이라 부르고, 익명 함수라고 부를 수 있다. 함수형 언어에서 람다 함수와 동일한 방법으로 사용할 수 있다. 다음 코드는 두개 인자의 합을 반환하는 add 함수와 함수 리터럴이다.
```go
// add 함수
func add(a, b int) int {
    return a + b
}

// 함수리터럴
func (a, b int) int {
    return a + b
}
```

이러한 리터럴은 변수에 전달하여 변수를 함수처럼 사용할 수 있다.
```go
func Example_funcLiteralVal() {
    printHello := func() {
        fmt.Println("Hello!")
    }
    printHello()    // Hello!
}
```
## 고계함수 (고차함수)
High-order function 함수 리터럴을 넘기고 받는것을 고계함수라 한다. 인자로 함수를 넘겨받아 상황에 맞게 재정의 하여 사용할 수 있다.

```go
func Example(num int, f func(param int)) {
    if num == 0 {
        f(0)
    } else {
        f(1)
    }
}

func main() {
    // 다음 결과는 1을 출력한다.
    Example(1, func(param int) {
        fmt.Println(param)
    })

    // 다음 결과는 0을 출력한다
    Example(0, func(param int) {
        fmt.Println(param)
    }) 
}
```

## 클로저 (closure) / 생성기 (generator)
클로저는 리터럴을 메모리 스택에 할당하여 사용하는 코드의 패턴? 이라 할 수 있다. 이 클로저를 리터럴로 반환하여 생성기 (generator)를 이용할 수 있다.
```go
func intSeq() func() int {
    // 외부 변수 i를 사용하는 클로저(closure) 와 이를 반환하는 생성기(generator)
    i := 0
    return func() int {
        i++
        return i
    }
}

func main() {
    nextInt := intSeq()

    fmt.Println(nextInt())  // 1
    fmt.Println(nextInt())  // 2
    fmt.Println(nextInt())  // 3

    newInts := intSeq()
    fmt.Println(newInts())  // 1
    fmt.Println(nextInt())  // 4
}
```
위 샘플코드의 ```intSeq()``` 는 리터럴을 반환하는 함수이다. main 함수의 ```nextInt``` 는 ```intSeq()``` 에서 반환하는 리터럴을 받는 **로컬 변수** 이다. ```initSeq()```는 이 로컬 변수에 할당되어 메모리의 stack 영역에 저장되기 때문에 heap 영역의 변수들까지 접근이 가능하다. 물론 initSeq() 의 리터럴은 새로운 변수에 할당하면 내부 변수들이 새로 할당되어 실행한다. ```newInts``` 라는 새로운 로컬변수에 리터럴을 할당하면 initSeq() 내부의 새로운 변수가 초기화 되어 ```newInts()``` 는 1부터 시작됨을 확인할 수 있다.

