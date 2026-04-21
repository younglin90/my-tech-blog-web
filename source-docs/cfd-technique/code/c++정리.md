# c++정리

> 원본: `code/c++정리.hwp`

암시적 변환을 피하기 위해 명시적 생성자 및 변환 연산자 사용하기

정적 전역 대신 명명되지 않은 네임스페이스 사용하기
<namespace {   void print() {} }>

심볼 버전 관리에 인라인 네임스페이스 사용하기
<namespace modernlib {   #ifndef LIB_VERSION_2   inline namespace version_1 {}     #endif    #ifdef LIB_VERSION_2   inline namespace version_2 {}     #endif }>

구조적 바인딩을 사용해 다중 반환값 처리하기

RAII : 리소스 획득은 초기화다
SFINAE : 템플릿 메타프로그래밍에서 타입에 대한 컴파일이 실패하면 다른 타입을 찾는 것을 뜻함

오류를 던지지 않는 함수에 noexcept 사용

프로그램의 상수 정확성 보장

컴파일 타임 상수 표현식 생성

unique_ptr을 사용해 메모리 자원을 고유하게 소유

이동 시맨틱 구현

회귀 템플릿 패턴(CRTP)을 사용한 정적 다형성

커링 : N개 인자를 가진 함수를 하나의 인자를 가진 N개 함수로 분해하는 과정

모나드 : 하나의 값과 하나의 고차원 함수를 가지는 디자인패턴

c++ 디자인 원칙
<추상화, 재사용  객체지향 :  다형성,  LSP -> 동작을 바꾸지 않고도 베이스 클래스 대신 파생 클래스를 사용할 수 있어야 한다>

RTTI : 실행 시간 타입 정보

디자인 패턴

espace

템플릿 메타 프로그래밍

std::is_lvalue_reference_v<> -> lvalue 인지 아닌지
std::type_identify<>::type -> 컴파일러가 타입을 유추하지 못하게(non-deduced context) 하기 위해 사용

패러렐

espace

모던 C++

espace
