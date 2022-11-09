import { getFilterParams } from "../src/index";
import { describe, test, expect } from "vitest";
import { FilterComparatorEnum, LogicOperatorEnum } from "../src/@types";
describe("getFilterParams", () => {
  test("test getFilterParams basic use", () => {
    const basicQueryInfo = {
      workerType: "workerType",
      deviceName: "deviceName1",
    };
    const filterMap = [
      {
        operator: LogicOperatorEnum.OR, //"OR"
        targetField: "",
        validWhen: true,
        children: [
          {
            operator: FilterComparatorEnum.EQ,
            targetField: "workerType",
            validWhen: true,
            children: null,
            directValue: basicQueryInfo.workerType,
          },
          {
            operator: FilterComparatorEnum.CONTAINS,
            targetField: "deviceName",
            validWhen: true,
            children: null,
            directValue: basicQueryInfo.deviceName,
          },
        ],
      },
    ];
    const resultData = {
      logicOperator: LogicOperatorEnum.AND,
      "@classType": "logic",
      filters: [
        {
          logicOperator: LogicOperatorEnum.OR,
          "@classType": "logic",
          filters: [
            {
              "@classType": "comparator",
              fieldName: "workerType",
              filterComparator: FilterComparatorEnum.EQ,
              ignoreCase: true,
              params: ["workerType"],
            },
            {
              "@classType": "comparator",
              fieldName: "deviceName",
              filterComparator: FilterComparatorEnum.CONTAINS,
              ignoreCase: true,
              params: ["deviceName1"],
            },
          ],
        },
      ],
    };
    expect(
      getFilterParams(LogicOperatorEnum.AND, basicQueryInfo, filterMap)
    ).toEqual(resultData);
  });
});
