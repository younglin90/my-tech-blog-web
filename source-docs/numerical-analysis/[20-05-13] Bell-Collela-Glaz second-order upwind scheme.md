# [20-05-13] Bell-Collela-Glaz second-order upwind scheme

> 원본: `numerical-analysis/[20-05-13] Bell-Collela-Glaz second-order upwind scheme.docx`

중력항을 고려한 비압축성 방정식은 다음과 같다.
첫번째 스텝은 다음을 풀어준다.
는 시간 n+1/2 에서 d 방향에서의 face 센터에서의 속도이다.  는 마찬가지에서의 수직 속도이다.
Bell-Collela-Glaz 의 2차 정확도 상류차분법은 다음과 같다.
여기서  와 는 셀 센터값이다.
여기서  은 주어진 방향에서 값의 크기를 측정하는 함수이다. 여기서 minmod slop limiter를 사용한다.
는 2이면 superbee이고, 1이면 minmod 가 된다.
