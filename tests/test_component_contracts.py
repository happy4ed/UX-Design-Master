import importlib.util
import json
import unittest
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('query_contracts',ROOT/'scripts/query_component_contracts.py')
query=importlib.util.module_from_spec(spec)
spec.loader.exec_module(query)


class ComponentContractsTest(unittest.TestCase):
    def test_related_core_ids_and_evidence(self):
        data=json.loads((ROOT/'knowledge/astryx-component-contracts.json').read_text())
        core={e['id'] for e in json.loads((ROOT/'knowledge/core-components.json').read_text())['entries']}
        ids=[e['id'] for e in data['entries']]
        self.assertEqual(len(ids),len(set(ids)))
        names={(e['package'],e['name']) for e in data['entries']}
        self.assertEqual(len(data['publicRuntimeExports']),907)
        self.assertFalse({tuple(x) for x in data['publicRuntimeExports']}-names)
        self.assertTrue(any(x['name']=='ButtonProps' for x in data['publicTypeExports']))
        self.assertTrue(all(x['resolution']=='static-type-checker' for x in data['publicTypeExports']))
        pool_count=len(data['resolvedPropertyPool'])
        self.assertTrue(all(0<=i<pool_count for t in data['publicTypeExports'] for i in t.get('propertyRefs',[])))
        self.assertTrue(all(0<=i<pool_count for e in data['entries'] for t in e.get('sourceTypeDeclarations',[]) for i in t.get('resolvedPropertyRefs',[])))
        for entry in data['entries']:
            self.assertTrue(entry.get('evidence'))
            self.assertIn(entry.get('relatedCoreId'),core|{None})
            self.assertFalse(entry['evidence']['runtimeValidated'])
            if entry['evidence']['level']=='static-export':
                self.assertFalse(entry['reviewedContracts'])

    def test_actual_lookup_and_unreviewed_boundary(self):
        result=query.search(core_id='table',limit=100)
        self.assertTrue(any(x['name']=='Table' for x in result['entries']))
        button=query.search(query='Button',limit=100)
        self.assertTrue(any(any(p['name']=='isLoading' for p in x['attributes']) for x in button['entries']))
        self.assertGreater(query.search(query='TourStep')['total'],0)
        self.assertEqual(query.search(query='LayoutAreaContext')['total'],0)
        self.assertGreater(query.search(query='LayoutAreaContext',include_unreviewed=True)['total'],0)

    def test_native_and_public_source_boundaries(self):
        selector=query.search(query='Selector',limit=100)['entries']
        portable=next(x['nativeContract'] for x in selector if x['name']=='Selector')
        self.assertIn('presentation',portable['webOnly'])
        self.assertTrue(any(x['platform']=='android' and 'menuStyle' in x['attributes'] for x in portable['platformAttributes']))
        aliases=query.search(query='BreadcrumbMenuItem',limit=5)['entries']
        self.assertTrue(any(x.get('aliasOf') and x.get('inheritedContract') for x in aliases))
        alias=query.search(query='BreadcrumbMenuItem',limit=1,full=True)['entries'][0]
        self.assertTrue(alias['inheritedContract']['attributes'])
        data=json.loads((ROOT/'knowledge/astryx-component-contracts.json').read_text())
        unresolved=[e['name'] for e in data['entries'] if e['evidence']['level']=='static-export' and not e['evidence'].get('resolvedImplementation')]
        self.assertEqual(unresolved,[])
        self.assertTrue(any(e.get('sourceTypeDeclarations') for e in data['entries']))
        charts=[e for e in data['entries'] if e['name']=='Chart' and e['package'] in ('lab','charts')]
        self.assertEqual({e['package'] for e in charts},{'lab','charts'})
        self.assertTrue(all(e['reviewedContracts'] for e in charts))
        button=next(e for e in data['entries'] if e['name']=='Button' and e['package']=='core')
        self.assertTrue(any(data['resolvedPropertyPool'][i]['name']=='isLoading' for decl in button['sourceTypeDeclarations'] for i in decl['resolvedPropertyRefs']))
        self.assertGreater(sum(bool(e.get('callSignatures')) for e in data['entries']),600)
        self.assertTrue(any(p['uncertain'] for p in data['resolvedPropertyPool']))
        compact=next(x for x in query.search(query='Button',limit=100)['entries'] if x['name']=='Button' and x['package']=='core')
        full=next(x for x in query.search(query='Button',limit=100,full=True)['entries'] if x['name']=='Button' and x['package']=='core')
        self.assertNotIn('resolvedProperties',compact['sourceTypeDeclarations'][0])
        self.assertTrue(any(p['name']=='isLoading' for t in full['sourceTypeDeclarations'] for p in t['resolvedProperties']))


if __name__=='__main__':
    unittest.main()
