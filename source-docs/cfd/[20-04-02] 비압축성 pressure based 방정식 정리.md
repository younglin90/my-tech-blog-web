# [20-04-02] 비압축성 pressure based 방정식 정리

> 원본: `cfd/[20-04-02] 비압축성 pressure based 방정식 정리.docx`

,
1) 모멘텀 방정식
x-momentum :
Over-relaxed diffusion :
따라서
coefficient
Consider the under relaxation factor ()
2) 압력 방정식 (연속 + 모멘텀)
모멘텀 방정식의 Rhie-Chow interpolation
평균값을 0이라고 하면
모멘텀 방정식 삽입
4) 화학종 방정식
Own or ngbr
coefficient
Consider the under relaxation factor ()
-중력텀
Denner, Fabian. Balanced-force two-phase flow modelling on unstructured and adaptive meshes. Diss. Imperial College London, 2013.
Density interpolation :
Incompressible (fluent) : arithmetic averaging
Compressible (fluent) : upwind
Pressure interpolation :
Fluent : PRESTO!
Volume fraction equation (fluent) :
Implicit :
Explicit :
Momentum (fluent) :
Face flux (fluent) :
SIMPLE (fluent) :
Rhie-Chow interpolation (FVM book) :
