# [18-11-26] Limiter와 Recon 정리-비정렬격자에서 v2

> 원본: `high-order/[18-11-26] Limiter와 Recon 정리-비정렬격자에서 v2.hwp`

● [2] [3] : Michalak and Ollivier-Gooch limiter 
  Barth and Jespersen limiter에서 새로운 함수를 넣는다.

  여기서  이다.
  는 다음의 기준을 만족하는 polynomial 이다.
 
  결론적으로,  이고, 다음의 방정식으로 구성된다.

  다음의 경우엔 리미터가 작동되지 않는다.

  여기서 는 tunable parameter 이다. 간단한 스위치를 사용하면 수렴성이 악화되어 차별성을 유지할 수 있으며 다음과 같이 새로운 수정 된 리미터가 사용된다.


  여기서  이다. 여기서 의 값을 쓴다

● hMLP (Hierarchical multi-dimensional limiting process) [5]
  리미터는 smooth한 지역에서 고차 정확도를 유지하고, 문제가 있는 셀에서만 활성화 되야만한다. 계층적(hierarchical) MLP는 두가지 요소로 구성된다: 하나는 고차 모드를 처리하는 MLP 기반의 문제가 된 셀의 마커이고, 다른 하나는 선형 모드에 대한 MLP 슬로프 리미터이다. 여기서 하위 셀의 분포가 선형적일 때 중요한 MLP-u 슬로프 리미터에 대해 간단히 요약한다.

3.1. MLP-u 슬로프 리미터
  MLP 조건은 셀 정점에서 최소 또는 최댓값을 가진다는 것에 기초한다.
  MLP 리미터의 범위는 다음과 같다.



  여기서 는 타겟 셀이고, 타겟 셀에 속해있는 는 벌텍스, 그리고 

 


  MLP-u 슬로프 리미터는 다음과 같다.



   은 machine epsilon 이고 여기서 unsteady state 계산의 경우엔 



  이고, steady-state 경우엔 MLP-u1 리미터가 솔루션 정확성을 손상시키지 않으면서 강건한 컨버전스 특성을 갖도록 수정된 MLP-u2 [6]로 얻어지고 다음과 같다.


  ,    ,  
  ,    ,    ,  

3.2. P1-Projected MLP 조건
  압축성 유동의
