# [20-07-20] 비압축성 pressure based 방정식 정리2

> 원본: `cfd/[20-07-20] 비압축성 pressure based 방정식 정리2.docx`

,
1. timestep 체크
2. 내부 timestep 시작
3. rho, u 저장
4. SIMPLE 시작
5. 비압축성 모멘텀 계산
6. 속도 B.C. 적용
7. MPI 실행하여 속도 넘김
8. 비압축성 압력 방정식 계산
9. 압력, 속도 B.C. 적용
10. MPI 실행하여 압력, 속도 넘김
11. 구한 압력으로 밀도 계산
12. SIMPLE 끝
13. 부피분율 계산
14. 부피분율 B.C. 적용
15. MPI 실행하여 부피분율 넘김
16. 구한 부피분율로 밀도 계산
5. 모멘텀 방정식 푸는 과정
압력텀이 생략된 모멘텀 방정식은 다음과 같다. (중력, 표면장력 고려)
1~ncells 까지
1~nfaces 까지
rhie chow interpolation 구하기
이면,
이면,
B.C. 이면,
점성력을 고려하면, (비압축성)
그리고
B.C. 가 아니면,
여기까지 했으면, Hypre 라이브러리로 Ax=B를 풀어줌
(input :   output :  )
속도에 URF 곱해서 업데이트 해줌
8. 압력 방정식 푸는 과정
1~ncells 까지
1~ncells 까지
1~nfaces 까지
1~ncells 까지
1~nfaces 까지
rhie chow interpolation 구하기
B.C. 가 아니면,
B.C. (Wall, Viswall) 이면,
B.C. 그밖에,
그리고,
여기까지 했으면, Hypre 라이브러리로 Ax=B를 풀어줌
(input :   output :  )
를 mpi 업데이트 시켜줌.
1~ncells 까지
1~nfaces 까지
B.C. 가 아니면,
B.C. (wall, invwall) 이면,
B.C. (suboutlet) 이면,
1~ncells 까지
1~ncells 까지
1~nfaces 까지
표면 속도 업데이트
B.C. 가 아니면,
13. 부피분율 계산
크랭크-니콜슨 방법:
1~ncells 까지
1~nfaces 까지
체적분율 재건설화 진행함.
1~nfaces 까지
이면,
이면,
여기까지 했으면, Hypre 라이브러리로 Ax=B를 풀어줌
(input :   output :  )
1~ncells 까지
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
