# [17-04-04] Ghost fluid 정리

> 원본: `high-order/[17-04-04] Ghost fluid 정리.hwp`

경계면에서 압력과 수직 속도는 연속적이다
Ghost fluid 의 압력과 수직 속도는 Real fluid 로부터 복사된다.
엔트로피와 접선 속도는 경계면에서 불연속이고, 이것들은 수직 방향으로 일정한 extrapolation을 사용하여 정의된다.
기체-액체 경계면처럼 하나의 유체가 stiff 하다면, 경계면 움직임에 대한 오리지널 GFM을 적용할 때 문제점은 경계면 근처에서 압력 진동이 발생하고, 그것은 계산의 발산으로 이끈다.
따라서 경계면의 각 사이에서는 세심한 치료가 요구된다. 이것을 위해 IGFM에서 리만 해법은 경계면에서 값을 구하기 위해 이용된다.
공기에 대한 Ghost fluid에서, 압력은 엔트로피와 접선 속도를 추가하여 Real 공기로부터 extrapolated 된다. 액체에 대한 ghost fluid에서, 수직속도와 엔트로피, 그리고 접선 속도는 Real 액체로부터 extrapolated 된다.
extrapolation에 대한 fast marching 방법에 기초한 fast extension 방법은 사용된다.

<EOS>
일반적인 EOS 는 다음과 같다.

이상기체에서의 EOS는 다음과 같다.

, 
 은 체적  내에서의 전체 질량이다.
이상유체에서의 엔트로피는 다음과 같다.(이상기체 EOS로부터 정의)


Stiffened EOS 는 다음과 같다.
, 여기서  는 stiff 유체에 대한 Gruneisen exponent 이다.  는 material dependent constant 이다. 이상기체에서는 ,  이다. 물의 경우에는 , 
음속은 다음과 같이 정의한다.

그러면 Stiffend EOS 로부터 다음과 같다.

mixing 지역에서의 음속은


<오리지널 GFM> -> 단점 : 경계면 근처의 강한 shock 또는 detonation wave 에서 압력 진동 발생
1D 오일러 방정식은 다음과 같다.


위 방정식을 close 할려면 EOS 가 필요하다. EOS의 Mie-Gruneison family 는 다음과 같다.
