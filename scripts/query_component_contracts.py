"""Find component contracts and documented API evidence in local knowledge."""
import argparse
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def search(query='', core_id='', include_unreviewed=False, limit=10, full=False):
    data = json.loads((ROOT/'knowledge/astryx-component-contracts.json').read_text())
    native = {item['name']: item for item in data.get('nativeContracts', [])}
    property_pool=data.get('resolvedPropertyPool',[])
    def hydrate(entry):
        entry=dict(entry)
        if entry['name'] in native:
            entry['nativeContract']=native[entry['name']]
        if entry.get('sourceTypeDeclarations'):
            declarations=[]
            for decl in entry['sourceTypeDeclarations']:
                refs=decl.get('resolvedPropertyRefs',[])
                visible={k:v for k,v in decl.items() if k!='resolvedPropertyRefs'}
                visible['resolvedPropertyCount']=len(refs)
                if full:visible['resolvedProperties']=[property_pool[i] for i in refs]
                declarations.append(visible)
            entry['sourceTypeDeclarations']=declarations
        return entry
    terms = query.casefold().split()
    matches = []
    for entry in data['entries']:
        if not include_unreviewed and not entry['reviewedContracts'] and not entry.get('aliasOf'):
            continue
        if core_id and entry.get('relatedCoreId') != core_id:
            continue
        searchable_data={k: entry.get(k) for k in ('name','relationship','relatedCoreId','reviewedContracts','attributes','sourceTypeDeclarations','callSignatures')}
        searchable_data['nativeContract']=native.get(entry['name'])
        if terms:
            searchable_data['resolvedProperties']=[property_pool[i] for decl in entry.get('sourceTypeDeclarations',[]) for i in decl.get('resolvedPropertyRefs',[])]
        searchable = json.dumps(searchable_data,ensure_ascii=False).casefold()
        if all(term in searchable for term in terms):
            if entry.get('aliasOf'):
                parent=next((x for x in data['entries'] if x['id']==entry['aliasOf']),None)
                entry={**entry,'inheritedContract':hydrate(parent) if parent else None}
            entry=hydrate(entry)
            matches.append(entry)
    return {'total':len(matches),'shown':min(len(matches),max(0,limit)),
            'note':'원본 API 기본값은 제품 기본값이 아니다. 상속 속성 전체는 --full로 조회한다. 런타임 검증과 독립 부품 여부는 별도 확인한다.',
            'entries':matches[:max(0,limit)]}


def main():
    parser=argparse.ArgumentParser(description='자체 컴포넌트 계약·속성 지식 검색')
    parser.add_argument('--query',default='')
    parser.add_argument('--core-id',default='')
    parser.add_argument('--include-unreviewed',action='store_true')
    parser.add_argument('--full',action='store_true',help='상속·합성 속성 전체를 복원')
    parser.add_argument('--types',action='store_true',help='공개 타입 이름 색인 검색')
    parser.add_argument('--limit',type=int,default=10)
    args=parser.parse_args()
    if args.types:
        data=json.loads((ROOT/'knowledge/astryx-component-contracts.json').read_text())
        terms=args.query.casefold().split()
        rows=[x for x in data.get('publicTypeExports',[]) if all(t in json.dumps(x,ensure_ascii=False).casefold() for t in terms)]
        output=[]
        for row in rows[:max(args.limit,0)]:
            refs=row.get('propertyRefs',[])
            item={k:v for k,v in row.items() if k!='propertyRefs'}
            item['propertyCount']=len(refs)
            if args.full:item['properties']=[data['resolvedPropertyPool'][i] for i in refs]
            output.append(item)
        result={'total':len(rows),'entries':output,'note':'타입 이름 색인이다. --full로 최상위 속성을 확인한다. 유니온·제네릭의 해석 범위는 별도 검토한다.'}
    else:
        result=search(args.query,args.core_id,args.include_unreviewed,args.limit,args.full)
    print(json.dumps(result,ensure_ascii=False,indent=2))


if __name__=='__main__':
    main()
