import { MVTImageryProvider } from "@reearth/cesium-mvt-imagery-provider";
import { FC, useEffect, useState } from "react";
import { useCesium } from "resium";

export const Imagery: FC = () => {
  const { viewer } = useCesium();
  const [isFeatureSelected] = useState<boolean>(false);
  useEffect(() => {
    const url =
      "https://assets.cms.plateau.reearth.io/assets/75/8b6820-1dea-4b21-ac5b-d33c66b42bcd/20220_azumino-shi_city_2025_citygml_1_op_luse_mvt/{z}/{x}/{y}.mvt";
    const layerName = "luse";
    const imageryProvider = new MVTImageryProvider({
      urlTemplate: url,
      layerName,
      minimumLevel: 8,
      maximumLevel: 16,
      worker: true,
      credit: "cesium.js",
      layer: {
        id: "123",
        type: "simple",
        data: {
          type: "mvt",
          jsonProperties: ["attributes"],
          url: "https://assets.cms.plateau.reearth.io/assets/75/8b6820-1dea-4b21-ac5b-d33c66b42bcd/20220_azumino-shi_city_2025_citygml_1_op_luse_mvt/{z}/{x}/{y}.mvt",
          layers: [layerName],
        },
        raster: {
          maximumLevel: 16,
        },
        polygon: {
          stroke: true,
          strokeColor: "#ff0000",
          fillColor: {
            expression: {
              conditions: [
                ['startsWith(${attributes["luse:class"]}, "田")', 'color("#F9F06F", 1)'],
                ['startsWith(${attributes["luse:class"]}, "畑")', 'color("#F5BC55", 1)'],
                ['startsWith(${attributes["luse:class"]}, "山林")', 'color("#00dc00", 1)'],
                ['startsWith(${attributes["luse:class"]}, "水面")', 'color("#0091C5", 1)'],
                ['startsWith(${attributes["luse:class"]}, "その他自然地")', 'color("#C69885", 1)'],
                ['startsWith(${attributes["luse:class"]}, "住宅用地")', 'color("#E8868F", 1)'],
                ['startsWith(${attributes["luse:class"]}, "商業用地")', 'color("#DF5555", 1)'],
                ['startsWith(${attributes["luse:class"]}, "工業用地")', 'color("#0073B0", 1)'],
                ['startsWith(${attributes["luse:class"]}, "公益施設用地")', 'color("#D691B5", 1)'],
                ['startsWith(${attributes["luse:class"]}, "道路用地")', 'color("#5b6373", 1)'],
                ['startsWith(${attributes["luse:class"]}, "交通施設用地")', 'color("#B0A2BF", 1)'],
                ['startsWith(${attributes["luse:class"]}, "公共空地")', 'color("#c8ffc8", 1)'],
                ['startsWith(${attributes["luse:class"]}, "その他①")', 'color("#77945B", 1)'],
                ['startsWith(${attributes["luse:class"]}, "その他②")', 'color("#652A60", 1)'],
                ['startsWith(${attributes["luse:class"]}, "その他②")', 'color("#652A60", 1)'],
                ['startsWith(${attributes["luse:class"]}, "その他③")', 'color("#5E5C60", 1)'],
                ['startsWith(${attributes["luse:class"]}, "その他④")', 'color("#7C745F", 1)'],
                ['startsWith(${attributes["luse:class"]}, "可住地")', 'color("#D7157E", 1)'],
                ['startsWith(${attributes["luse:class"]}, "原野・牧野")', 'color("#C69885", 1)'],
                ['startsWith(${attributes["luse:class"]}, "住宅")', 'color("#FF1493", 1)'],
                ['startsWith(${attributes["luse:class"]}, "共同住宅")', 'color("#DC143C", 1)'],
                [
                  'startsWith(${attributes["luse:class"]}, "作業所併用住宅")',
                  'color("#800000", 1)',
                ],
                ['startsWith(${attributes["luse:class"]}, "業務施設")', 'color("#B22222", 1)'],
                ['startsWith(${attributes["luse:class"]}, "商業施設")', 'color("#FFA07A", 1)'],
                ['startsWith(${attributes["luse:class"]}, "官公庁施設")', 'color("#93CCA4", 1)'],
                ['startsWith(${attributes["luse:class"]}, "文教厚生施設")', 'color("#7B68EE", 1)'],
                ['startsWith(${attributes["luse:class"]}, "供給処理施設")', 'color("#00FFFF", 1)'],
                ['startsWith(${attributes["luse:class"]}, "公園・緑地")', 'color("#53B3B5", 1)'],
                ['startsWith(${attributes["luse:class"]}, "墓園")', 'color("#463042", 1)'],
                [
                  'startsWith(${attributes["luse:class"]}, "その他公的施設用地")',
                  'color("#6603FC", 1)',
                ],
                ['startsWith(${attributes["luse:class"]}, "空地")', 'color("#F1C7FF", 1)'],
                [
                  'startsWith(${attributes["luse:class"]}, "農林漁業施設用地")',
                  'color("#99FF00", 1)',
                ],
                ['startsWith(${attributes["luse:class"]}, "不明")', 'color("#333333", 1)'],
                ['startsWith(${attributes["luse:class"]}, "農地")', 'color("#F9F06F", 1)'],
                ['startsWith(${attributes["luse:class"]}, "宅地")', 'color("#FF1558", 1)'],
                ['startsWith(${attributes["luse:class"]}, "建築敷地")', 'color("#FF1558", 1)'],
                ['startsWith(${attributes["luse:class"]}, "空地")', 'color("#F1C7FF", 1)'],
                [
                  '${attributes["luse:class"]} === "宅地（住宅用地、商業用地等の区分が無い）"',
                  'color("#FF5E8C", 1)',
                ],
                [
                  'startsWith(${attributes["luse:class"]}, "道路・鉄軌道敷")',
                  'color("#CECECE", 1)',
                ],
                ['startsWith(${attributes["luse:class"]}, "農地")', 'color("#f9f06f", 1)'],
                ['startsWith(${attributes["luse:class"]}, "低未利用土地")', 'color("#d765dc", 1)'],
                ['startsWith(${attributes["luse:class"]}, "その他")', 'color("#555053", 1)'],
                ["true", 'color("#ffffff", 1)'],
              ],
            },
          },
        },
        visible: true,
      },
    });

    const layers = viewer.scene.imageryLayers;
    const currentLayer = layers.addImageryProvider(imageryProvider);

    return () => {
      layers.remove(currentLayer);
    };
  }, [viewer, isFeatureSelected]);
  return <div />;
};
