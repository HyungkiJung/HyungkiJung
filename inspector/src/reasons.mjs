// Rule-based review aid from plan R26 and O2/O3. Does not verify factual truth.
const terms={workers:['종사자','인원','직원','고용'],operatingDays:['조업일','영업일','근무일'],hoursPerDay:['조업시간','근무시간'],production:['생산'],own:['자체생산','생산'],outsourced:['위탁'],entrusted:['수탁'],purchased:['구입','구매'],reprocessed:['재투입'],domestic:['내수','국내시판'],exported:['수출'],otherShipped:['기타출하'],closingStock:['재고'],shipmentTotal:['출하','판매'],shipmentDomesticExport:['출하','판매'],capacity:['생산능력','능력','단가']};
export function inspectReason(note,{metric,direction,responseState}={}){
 const text=String(note??'').trim();
 if([3,4].includes(responseState))return {code:'RESPONSE_MANAGEMENT_REASON',category:'응답관리 사유',fragment:text,manual:true};
 if(!text)return {code:'REASON_ABSENT',category:'사유 없음',fragment:'',manual:true};
 if(/#(?:REF!|DIV\/0!|VALUE!|N\/A|NAME\?|NUM!)/i.test(text))return {code:'REASON_ERROR_LITERAL',category:'오류 입력 후보',fragment:text,manual:true};
 if(/^[\p{N}\p{P}\p{S}\s_]+$/u.test(text)||/^(.)\1{5,}$/.test(text))return {code:'REASON_UNREADABLE',category:'판독 불가 후보',fragment:text,manual:true};
 const hints=terms[metric]??[metric];const clauses=text.split(/[\n.;。；]/).filter(x=>hints.some(t=>x.includes(t)));
 if(!clauses.length)return {code:'REASON_METRIC_UNLINKED',category:'해당 항목 사유 연결 확인',fragment:text,manual:true};
 const fragment=clauses.join(' / '),up=/증가|증원|확대|늘어|상승/.test(fragment),down=/감소|감원|축소|줄어|하락/.test(fragment);
 if(up&&down)return {code:'REASON_DIRECTION_AMBIGUOUS',category:'증감방향 수동 확인',fragment,manual:true};
 if(direction>0&&down||direction<0&&up)return {code:'REASON_DIRECTION_MISMATCH',category:'방향 불일치 후보',fragment,manual:true};
 if(!(direction>0?up:direction<0?down:up||down))return {code:'REASON_DIRECTION_UNCLEAR',category:'증감방향·사유 확인',fragment,manual:true};
 const cause=/수주|주문|계약|수요|납기|휴일|휴무|연휴|보수|정비|고장|파업|인력|퇴사|입사|채용|설비|원재료|원자재|단가|가격|가동중단|공장|재개|폐업|결산/.test(fragment);
 if(!cause)return {code:'REASON_PHENOMENON_ONLY',category:'단순 현상 기술 후보',fragment,manual:true};
 return {code:'REASON_CAUSE_RECORDED',category:'원인 표현 있음 · 사실성 별도 확인',fragment,manual:true};
}
