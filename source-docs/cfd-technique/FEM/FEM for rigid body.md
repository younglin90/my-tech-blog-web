# FEM for rigid body

> 원본: `FEM/FEM for rigid body.docx`

강체 이론 정리
입자의 속도
질량 중심 선형 모멘텀
각 모멘텀
라 하자. 여기서  은 초반에
그리고, 다른서적에서,
: increment of rotation
질량 중심
선형 모멘텀
: angular velocity
: total linear momentum
질량중심에서는 오른쪽항이 0이 되므로,
: total mass
따라서,
각 모멘텀
: total angular momentum
: inertia tensor
: total torque
관성 텐서
: x로부터 ith 입자의 변위
I를 다시 쓰면,
여기서,  이다.  은 orientation matrix 다.
는 초기 입자의 x로부터 위치. 그리고  이다. 따라서,
가 스칼라이기 때문에,
따라서,
또한,  이기 때문에,
강체의 운동 방정식은 다음과 같이 구성한다.
쿼터니언 적용
로 정의된 쿼터니언을 다음과 같이 쓴다.
쿼터니안 곱은 다음과 같이 정의한다.
단위 축  에 대해 라디안 회전은 다음과 같이 정의한다.
만약 q1과 q2가 쿼터니언이라면, q2q1은 q1과 q2의 복합 회전이다.
위에서 정의한  을 쿼터니언 형태로 다시 쓰면,
정리
여기서,  대신 쿼터니안을 사용하면,
여기서, 형상 함수를 이용하면,
사면체의 형상 함수는
여기서,
매쓰매티카를 사용해서 계산하면,
