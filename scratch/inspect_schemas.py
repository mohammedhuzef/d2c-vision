import json

d = json.load(open('contracts/openapi.json'))
schemas = d['components']['schemas']

target_schemas = [
    'ProductCreate', 'ProductDetailResponse', 'ProductListResponse',
    'CompetitorCreate', 'CompetitorItem', 'CompetitorListResponse', 'CompetitorResponse',
    'ValidationRunResponse', 'ValidationRunDetailResponse', 'ReadinessResponse', 'ValidationResultItem',
    'RecommendationListResponse', 'RunRecommendationListResponse', 'RecommendationItem',
    'SimulationRequest', 'SimulationResponse',
    'ProductVersionListResponse', 'VersionCompareResponse', 'ImpactEventResponse',
    'ReportResponse', 'ResearchStatusResponse'
]

for name in target_schemas:
    s = schemas.get(name)
    if not s:
        print(f"=== {name}: NOT FOUND ===")
        continue
    props = s.get('properties', {})
    print(f"=== {name} ===")
    for p, val in props.items():
        type_str = val.get('type') or val.get('$ref') or 'any'
        if '$ref' in val:
            type_str = val['$ref'].split('/')[-1]
        print(f"  {p}: {type_str}")
