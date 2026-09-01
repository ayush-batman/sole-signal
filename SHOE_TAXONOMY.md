# Footwear Taxonomy

The executable contract lives in `packages/domain/src/taxonomy.ts`; this document defines its meaning.

## Facets

- Audience: men, women, unisex, boys, girls, kids.
- Primary category: casual, formal, performance, comfort, ethnic, safety, school, outdoor.
- Product type: sneaker, running shoe, walking shoe, training shoe, loafer, oxford, derby, monk strap, moccasin, sandal, floater, slipper, flip-flop, slide, clog, mule, ballet flat, pump, heel, wedge, boot, jutti, mojari, kolhapuri, school shoe, safety shoe.
- Sport: running, walking, gym, badminton, tennis, pickleball, padel, football, cricket, basketball, hiking, trekking.
- Construction and appearance: silhouette, height, toe, closure, heel, sole, upper, lining, colours, pattern, texture, embellishments.
- Performance: cushioning, arch support, waterproof, breathable, wide fit, lightweight, slip resistant, non-marking.
- Aesthetics: retro terrace, minimalist, chunky, dad shoe, court inspired, gorpcore, barefoot, quiet luxury, streetwear, athleisure, comfort first, orthopaedic, monsoon, resort, wedding, festive, heritage ethnic.

## India-first language

Normalisation recognizes Indian terms and spelling variants including chappal, hawai, floater, school shoe, safety shoe, jutti, mojari, kolhapuri, festive, wedding, monsoon, MRP, and colour. It preserves the source title and records every inferred value separately.

## Provenance

Every extracted attribute stores value, extraction method (`source`, `rule`, `model`, or `human`), model version, prompt version, confidence, material-change hash, and whether a person corrected it. Human corrections win over automated extraction but retain the original evidence.

## Compatibility rules

Style clusters cannot cross incompatible primary categories. Sport is optional and only valid for relevant performance/outdoor products. Product type and category combinations are validated, not silently rewritten.
