# [19-03-13] Multigrid 정리

> 원본: `numerical-analysis/[19-03-13] Multigrid 정리.hwp`

● 
1. Agglomerated grids

full approximation scheme (FAS)
   에서 다음 coarser grid 인  까지 계산은 다음과 같다.

 


  여기서, interpolation 된 variables 은

  

  이고, 는 셀 부피고, 는 fine grid에서 coarser grid 의 속해있는 같은 영역들이다. 그리고 interpolation 된 레지듀얼은 다음과 같다.



  그리고 마지막으로, 는 variable의 correction에 사용되고 다음과 같다.



  

Mesh hierarchy

2. Interpolation

3. Restriction

4. operator coarsensing and pure geometric multigrid

1. coarser grid로 residual (restriction operator 사용)과 variables (interpolation operator 사용)을 전달 
2. coarser grid에서 residual 계산
3. forcing function 계산 (둘의 레지듀얼 차이, Q=Rh-R2h)
4. coarser grid correction : 다시 coarser grid 로 variables 전달. (prolongation operator 사용)
--- [1] 논문 정리
두 옵션이 존재함.
서로 다른 격자에 걸친 루프는 다른 블록 위에 루프 내부 또는 외부에 놓일 수 있습니다. 루프 외부의 다른 그리드 위에 루프를 배치하고 멀티 블록주기 동안 모든 블록을 단계적으로 처리합니다.
격자 , m=1,....,M 까지 있다고 해보자. M은 최대로 작고 조밀한 격자를 의미함.
그럼 방정식은 다음과 같다.

Res_M(u_M)은 최고로 조밀한 격자 M에서의 Residual을 의미한다.

4.4.1. 조밀 -> 성긴 sweep
더 성긴 m에서의 수정된 반 방정식은 다음과 같다.

여기서 은 forcing funct
