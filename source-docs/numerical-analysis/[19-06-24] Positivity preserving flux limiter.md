# [19-06-24] Positivity preserving flux limiter

> 원본: `numerical-analysis/[19-06-24] Positivity preserving flux limiter.hwp`

● Positivity preserving flux limiter [1] 내용 정리
압력이 낮은 구간의 상 경계면에서 압력이 마이너스 값이 발생될 수 있을 가능성이 크다.
따라서 다음과 같은 positivity preserving flux limiter 를 적용한다.

3차원에서,,, Euler equation





Structured grid에서,


다음으로 변경할 수 있다



다음으로, first-order Lax-Friedrichs flux 는 다음과 같다.

위 식은 CFL<=0.5에서 rho 와 p 가 positive 한 조건을 만족한다.

-> flux limiter for positive density
,  ..... 등 초기화한다.
만약  이면,  로부터  을 구함.
만약  이면,  로부터  을 구함.
최종적으로,  으로 두고,  을 구한다.
여기서  이고, 여기서  은 초기 상태에서 최소 밀도값이다. 

그리고 limited flux 는 다음과 같다.



-> flux limiter for positive pressure
1. ,  ..... 등 초기화한다.
2. 만약  이면,  로부터  을 구함.
3. 만약  이면,  로부터  을 구함.
4. 최종적으로,  으로 두고,  을 구한다.
여기서  이고, 여기서  은 초기 상태에서 최소 밀도값이다. 

최종적인 limited flux 는 다음과 같다.



따라서 다음과 같다.


Reference

[1] X.Y. Hu et al. / Journal of Computational Physics 242 (2013) 169–180
