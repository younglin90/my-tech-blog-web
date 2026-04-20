# FEM for shell3

> 원본: `FEM/FEM for shell3.docx`

쉘 방정식 정리
Lagrangian 형식
: Green-Lagrange 변형률 텐서
: 2nd Piola-Kirchhoff 텐서
Eulerian 형식
: Cauchy stress 텐서
유용한 수식
: 1st Piola-Kirchhoff 텐서
는 대칭행렬
: Cauchy-Green 텐서
MITC interpolation 보간 새로운 방법
Sussman, Theodore, and Klaus-Jürgen Bathe. "3D-shell elements for structures in large strains." Computers & structures 122 (2013): 2-12.
여기서
그리고
여기서  는 3개의 unknown 값이다. 따라서 3개의 방정식이 필요.
2개는 위의 방정식 2개. 나머지 하나는 체적보존 방정식
따라서
그러므로
고차 로드리게스 회전행렬 업데이트
따라서
Lagrangian 형식으로 유도 (x 좌표계)
그레디언트는
여기서
따라서
헤시안을 구해보자. 여기서,
그러면
여기서
그러면
정리하면
Ijk notation으로 나타내면,
Shape function 으로 차분화하면
Lagrangian 형식으로 유도 (r 좌표계)
특정 미분값을 r좌표계로 바꾸면,
따라서,
여기서
그리고
그러면
x좌표계로 정리하면
다시 이거를 r좌표계로 정리하면
Eulerian 형식으로 유도 (x 좌표계)
그레디언트는
그리고
공변기저좌표계로 유도
여기서 선형 모델에서는
그리고
그러면
정리하면
차분화하면,
정리하면,
여기서
이걸로 다시 유도해보자..
그러면,
정리하면
수도코드
에너지
Gradient
Hessian
여기서
그러면,
여기서
Alpha, beta 2차항은,
