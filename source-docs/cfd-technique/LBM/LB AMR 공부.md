# LB AMR 공부

> 원본: `LBM/LB AMR 공부.docx`

LBM AMR
메쉬는 두 종류가 있다
(a) : node-centered lattice
(b) : cell-centered lattice
(b) 가 parallel 하기에 좀 더 편하다.
(a) 의 검은 부분을 overlap 또는 interface 부분이라고 하는데, 이 부분에서 크기가 다른 메쉬가 겹쳐져 있다. 이 부분에서는 값을 모르기 때문에 주위에서의 값으로 보간해야한다. 크기 차이로 생긴 다른 velocity set 크기로의 전달을 rescale 라고 한다. 따라서, lattice AMR 에서는 rescale 방법과 보간 방법이 주요한 역할을 한다.
Rescale 방법
rescale 해도 보존변수는 같아야한다. 따라서 rho, u, p, ... 등은 같아야 한다. 그리고 이 원리대로라면,  여야만 한다. 여기서  는 coarse-lattice,  는 fine-lattice을 의미한다. 따라서,
그리고,
omega
점성계수는 다음과 같다.
점성계수는 일정해야만 한다.
Collide-and-stream algorithm
Explosion (coarse-to-fine communication)
Fine 셀은 coarse 셀의 PDF가 균일하게 분포된다.
Coalescence (fine-to-coarse communication)
interpolation rescale 방법
다른 level 사이의 셀 한층을 오버랩 셀로 지정한다. (위 그림 회식 셀) 오버랩 셀은 모든 level 의 point가 다 존재한다.
3차원에서, coarse-to-fine 은 tri-linear interpolation 을 사용하여 구하며, 다음과 같다. 여기서 Y(x,y,z) 은 fine 셀에서의 변수 값, Y(x1,y1,z1) 등은 coarse 에서의 변수 값이다.
Fine-to-coarse 는 다음과 같이 평균화 시킨다.
여기서 d는 차원의 개수이다.
non-equilibrium rescale 방법
Dupuis and Chopard 가 제안했다. 참고로, non-equilibrium 값은, 위에서 설명한 interpolation 방법으로 구한 macroscopic 변수 값을 이용해 계산한다.
Non-equilibrium 을 각 레벨에서 직접 구하는 방법
Grad’s approximation 에서,
그리고,
여기서
이므로,
그러면,
따라서,
Non-equilibrium 을 다른 레벨의 값을 이용해 보간하는 방법
정리하면,
따라서
그러므로,
또는, Chapmann-Enskog 유도할 때 사용되는 식으로도 구할 수 있다.
