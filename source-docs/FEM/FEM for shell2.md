# FEM for shell2

> 원본: `FEM/FEM for shell2.docx`

Solid 에서 이렇게 되어있음
Neo‐Hookean 재료의 변형‐에너지 밀도
코시 응력텐서
탄성계수 텐서
쉘에서는, 평판 local coordinate 에서 global cartesian coordinate 로 바꿔야함.
쉘에서, nature coordinate, local coordinate, global coordinate, 3종류가 있음.
Nature coordinate 는  로,
Local coordinate 는 r, s, t 로,
Global coordinate  는 x, y, z 로 표시하기로 한다.
그러면,
Constitutive component
여기서
그러면
그러면
여기서
그러면
Voigt 형태로 표현하면 (note : Ba4, 5, 6 에는 2가 곱해져 있다는 점)
여기서, 기본 solid 에서는 다음과 같이 표현함(검증용)
마찬가지로
따라서
Initial stress component
여기서
그리고
치환공식을 사용하면
===
검증해보기
Double-contraction 성질로 인해
여기서
따라서
그러면,
그러면,
===
Shell 방정식으로 하면,
여기서
그러면,
그러면,
여기서
Residual force
여기서
여기서 Voigt notation
B는 위에서 정의했었음
미분텀들 구하는 방법
여기서
따라서
MITC 응용
f 를 MITC interpolation 으로 적용해보기
MITC3+
MITC4
B를 분해하기
여기서
검증
그러면
Voigt 형태로 표현하면 (note : Ba4, 5, 6 에는 2가 곱해져 있다는 점)
다음으로, rst 의 B를 xyz 의 B로 바꿀려면, Voigt 형태의 B를 3x3 행렬로 바꿔주고,
여기서
검증을 해보자.  가 나오는지…
검증용 식
Neo Hookean 에너지
각각 미분하면,
