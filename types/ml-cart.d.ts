declare module "ml-cart" {
  type Sample = (number | string | boolean | null | undefined)[];
  type Samples = Sample[];
  type Labels = (string | number | boolean)[];

  interface TreeNode {
    name?: string;
    kind?: string;
    height?: number;
    depth?: number;
    rule?: string;
    splitValue?: number;
    left?: TreeNode;
    right?: TreeNode;
    distribution?: Record<string, number>;
  }

  export interface TrainingOptions {
    gainFunction?: "gini" | "entropy";
    splitFunction?: string;
    minNumSamples?: number;
    maxDepth?: number;
  }

  export class DecisionTreeClassifier {
    constructor(options?: TrainingOptions);
    train(features: Samples, labels: Labels): void;
    predict(samples: Samples): Labels;
    toJSON(): TreeNode;
    exportJSON(): TreeNode;
    importJSON(json: TreeNode): void;
  }
}
