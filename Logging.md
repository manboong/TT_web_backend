# 로깅 전략

**우선 전략 목표**

1. 로그를 사용하는 각 시나리오 별로 적절한 데이터 수정 및 가공이 가능하도록 하여야한다.
    - e.g.
    - 어떠한 유저의 특정 행동을 로그에서 추출하기
    - 에러 레벨의 로그만을 선택적으로 살펴보기
    - 마케팅 (이벤트 효과 측정 등) / 기획 (A/B 테스트 결과 등) 등
2. 로그 코드(숫자)-로그 레벨-로그 진행 타겟(API 메서드 명)-로그 기록 시각-로그 목표(에러 표시 / 엑세스 로그 / 보안 로그)-트레이스 id(유저에서 생성)-depth
3. 로그 기록이 발생하는 시점에서 수행하여야하는 기능을 핸들러로써 등록할 수 있도록 한다
4. 에러 발생 시에는 다음과 같은 정보가 식별될 수 있도록 하여야한다 - 인풋 데이터 / 함수 명 / 코드 라인 넘버 / 에러 로그 / 스택 트레이스 /
5. 모니터링을 어떻게 진행할지 생각하기

**에러 핸들링 전략**

입력 관점에서의 에러 핸들링 전략

컨트롤러의 입장

1. 비지니스 로직과는 동떨어져 있다
2. 함수에 따라서 복잡한 처리를 진행할 때가 존재한다(e.g. 트랜잭션)
3. 에러의 책임소재가 무었인지 컨트롤러 입장에서는 알기 힘들다
    1. 입력값이 이상할 경우 컨트롤러의 잘못인가?
    2. db 리턴 값이 이상할 경우 입력값의 문제인가 db의 문제인가?
    3. 만약 어떠한 에러가 발생하면 어떻게 대응해야하는가? 컨트롤러에게 어떠한 책임소재가 있는것인가?
4. 의문점
    1. Root of trust를 지정해야하나? -> 가정할 수 있다면 Error 클래스의 설계를 단방향으로 설정가능함
    2. 에러와 에러가 아닌 부분을 어떻게 설정?

에러 핸들링을 진행하는 입장에서

1. 핸들링 코드가 분산되어 있는 것은 바람직하지 않다
2. 에러에 따라서 다른 행동을 하고싶을 수 있다 (즉 에러 발생 지점에서 핸들링을 하고 싶을 수 있다) -> 분리된 핸들링 코드가 발생함
