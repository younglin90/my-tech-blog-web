# [SEMO] high order 정리

> 원본: `high-order/[SEMO] high order 정리.docx`

2차 다항식 (gradient + hessian) TVD limiter 적용 과정
Face 를 구성하는 vertex 를 v1, v2, … vk라 합세.
페이스를 F, L셀을 cL, R셀을 cR, LL셀을 cLL 이라 합세.
원래 TVD계열 스킴을 cLL, cL, cR 을 사용해서 fL 값을 구함.
근데 이후로는 내 아이디어를 첨가해서 다시 유도하겠음 (2025-05-26)
다항식의 계수를 least square로 구했다고 일단 가정하겠음
그리고,
를 구할 때는,
그러나 여기서는,
을 사용함.
그러면 이렇게 사용하기로 한다.
이걸 가지고 TVD limiter, 또는 DWF limiter 를 구한다. 여기서는 DWF,  를 구하기로 함. 그러면,
그리고 MLP를 직접 유도하면, TVD 조건은 다음과 같음.
그리고
여기서, 테일러 2차까지 확장해서 정리하면,
그러면,
가 된다. 여기서,
라 하면,
따라서,
또는 평균값 안쓰고 해도됨.. 테스트해보자.
가 된다.
그러면,
가 되고, 다음을 가정하면,
그러면,
따라서 정리하면,
이면,
이면,
그리고,
이다.
그리고 기존의 TVD 리미터의 DWF와 함께 사용하면,
이렇게 됨.  가 0이면 upwind, 1이면 downwind 이다.
최종적으로,
