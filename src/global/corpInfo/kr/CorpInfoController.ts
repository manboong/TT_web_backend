import { Consumer } from "../../../models/rdbms/Consumer";
import { Corporation } from "../../../models/rdbms/Corporation";

const CORP_API_KEY = process.env.CORP_API_KEY;
const CORP_API_BASE_URL = process.env.CORP_API_BASE_URL;
const CORP_API_END_POINT = "getCorpOutline_V2";

// prettier-ignore
interface IExternItem {
    // Argument name | type     // sample value | explaination
    
    actnAudpnNm: string         // "" 회계 감사를 실시한 감사인의 명칭 
    audtRptOpnnCtt: string      // "" 회계감사에 대한 감사인의 의견 
    enpMainBizNm: string        // "" 기업이 영위하고 있는 주요 사업의 명칭 
    enpKrxLstgAbolDt: string    // "" 기업의 KONEX(자본시장을 통한 초기 중소기업 지원을 강화하여 창조경제 생태계 기반을 조성하기 위해 개설된 중소기업전용 주식시장) 상장 폐지 일자 
    smenpYn: string             // "" 해당 기업이 중소기업인지를 관리하는 여부 
    enpMntrBnkNm: string        // "" 기업의 주거래 은행 명칭 
    enpEmpeCnt: string          // "0" 기업의 종업원 인원수 
    empeAvgCnwkTermCtt: string  // "" 기업의 종업원의 평균 근속 년수 
    enpPn1AvgSlryAmt: string    // "0" 기업의 1인 평균 급여 금액 
    fstOpegDt: string           // "20230823" 최초개방일자 
    lastOpegDt: string          // "20241202" 최종개방일자 
    crno: string                // "1101113892240" 법인등록번호 
    corpNm: string              // "케이씨지아이자산운용 주식회사" 법인(法人)의 명칭 
    corpEnsnNm: string          // "KCGI Asset Management" 법인(法人)의 영문 표기 명 
    enpPbanCmpyNm: string       // "케이씨지아이자산운용" 기업 공시 회사의 이름 
    enpRprFnm: string           // "김병철" 기업 대표자의 이름 
    corpRegMrktDcd: string      // "E" 법인이 어느 시장에 등록되었는지를 관리하는 코드 
    corpRegMrktDcdNm: string    // "기타" 법인이 어느 시장에 등록되었는지를 관리하는 코드의 명칭 
    corpDcd: string             // "" 법인등록번호(5,6 자리)내 법인종류별분류번호(5,6 자리) 
    corpDcdNm: string           // "" 법인구분코드명 
    bzno: string                // "1078708658" 세무에서, 신규로 개업하는 사업자에게 부여하는 사업체의 고유번호 
    enpOzpno: string            // "07326" 기업의 소재지 구우편번호 (6자리) 
    enpBsadr: string            // "서울특별시 영등포구 국제금융로 10 15층(여의도동, 원아이에프씨동)" 기업의 소재지로 우편번호에 대응되는 기본주소 
    enpDtadr: string            // "" 기업의 소재지로 우편번호에 대응되는 기본주소외의 상세주소 
    enpHmpgUrl: string          // "" 기업의 홈페이지 주소 
    enpTlno: string             // "02-6320-3000" 기업의 전화번호 
    enpFxno: string             // "02-6320-3009" 기업의 팩스 번호 
    sicNm: string               // "" 산업 주체들이 모든 산업활동을 그 성질에 따라 유형화한 분류 이름 
    enpEstbDt: string           // "20080506" 기업의 설립일자 
    enpStacMm: string           // "12" 기업의 결산 월 
    enpXchgLstgDt: string       // "" 기업의 거래소 상장 일자 
    enpXchgLstgAbolDt: string   // "" 기업의 거래소 상장 폐지 일자 
    enpKosdaqLstgDt: string     // "" 기업의 주식이 코스닥 시장에 상장 등록된 일자 
    enpKosdaqLstgAbolDt: string // "" 기업의 주식이 코스닥 시장에 상장 페지된 일자 
    enpKrxLstgDt: string        // "" 기업의 KONEX(자본시장을 통한 초기 중소기업 지원을 강화하여 창조경제 생태계 기반을 조성하기 위해 개설된 중소기업전용 주식시장) 상장 일자 
    fssCorpUnqNo: string        // "00685935" 금융감독원에서 관리하는 법인의 고유번호 
    fssCorpChgDtm: string       // "2023/08/23" 금융감독원에서 관리하는 법인 정보의 변경일시 
}

// Fit data format
const fitExternDataFormat = (item: IExternItem | undefined) => {
    if (item === undefined) {
        return undefined;
    }

    const ret = {
        corp_name: item.corpNm,
        biz_num: item.bzno,
        corp_num: item.crno,
        corp_name_glb: { en: item.corpEnsnNm },
        nationality: "kr",
        ceo_name: item.enpRprFnm,
        corp_address: item.enpBsadr,
        phone_number: item.enpTlno,
        biz_started_at: item.enpEstbDt,
        site_url: item.enpHmpgUrl,
    };
    return ret;
};

export const externReqCorpProfile = async (corpNum: number) => {
    // watch out!! This code calls extern API request
    // Error should be handled carefully
    // Detailed spec of API can be found at https://www.data.go.kr/data/15043184/openapi.do#/API%20%EB%AA%A9%EB%A1%9D/getCorpOutline_V2
    try {
        const getParams = {
            serviceKey: CORP_API_KEY,
            pageNo: 1,
            numOfRows: 10,
            resultType: "json",
            crno: corpNum,
        };
        const getQuery = new URLSearchParams(getParams).toString();
        const getUrl =
            CORP_API_BASE_URL + "/" + CORP_API_END_POINT + "?" + getQuery;

        const externReq = await fetch(getUrl, {
            method: "GET",
        });
        const externJson = await externReq.json();
        console.log("extern", externJson);
        if (externJson.response.body.totalCount === 0) {
            // No such corporation exist
            return undefined;
        }
        // Don't know why 'body.items.item' ?!. Blame Korean government
        const items = externJson.response.body.items.item;

        return fitExternDataFormat(items.at(0));
    } catch (error) {
        console.log(error);
        return undefined;
    }
};

export const createCorpProfile = async (corpProfile) => {
    const createdProfile = (await Corporation.create(corpProfile)).get({
        plain: true,
    });

    return createdProfile;
};

export const findCorpProfileByCorpNum = async (corpNum: number) => {
    const corpProfile = (
        await Corporation.findOne({ where: { corp_num: corpNum } })
    )?.get({ plain: true });

    return corpProfile;
};

export const findCorpProfileByCorpId = async (corpId: number) => {
    const corpProfile = (
        await Corporation.findOne({ where: { corp_id: corpId } })
    )?.get({ plain: true });

    return corpProfile;
};
