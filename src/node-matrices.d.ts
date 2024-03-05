declare module 'node-matrices' {
    export = Matrix;

    class Matrix<T = number> {
        static identity(size: any): this;
        static zeros(numRows: any, numColumns: any): this;
        constructor(...args: any[]);
        data: T[][];
        numRows(): number;
        numColumns(): number;
        get(rowIndex: number, columnIndex: number): T;
        getRow(rowIndex: number): this;
        getColumn(columnIndex: number): this;
        sliceRows(startIndex: number, endIndex: number): this;
        sliceColumns(startIndex: number, endIndex: number): this;
        sliceBlock(
            startRowIndex: number,
            endRowIndex: number,
            startColumnIndex: number,
            endColumnIndex: number,
        ): this;
        omitRow(rowIndex: number): this;
        omitColumn(columnIndex: number): this;
        combineHorizontal(otherMatrix: Matrix): this;
        combineVertical(otherMatrix: Matrix): this;
        replace(rowIndex: number, columnIndex: number, value: T): this;
        transpose(): this;
        determinant(): any;
        adjugate(): this;
        inverse(): this;
        add(otherMatrix: Matrix): this;
        subtract(otherMatrix: Matrix): any;
        _baseMultiply(columnMatrix: any): any;
        multiply(otherMatrix: Matrix): this;
        scale(scalar: number): this;
        pow(exponent: number): any;
        equals(otherMatrix: any): any;
        isSquare(): boolean;
        isSymmetric(): any;
        isSkewSymmetric(): any;
        isUpperTriangular(): boolean;
        isLowerTriangular(): boolean;
        isDiagonal(): boolean;
        isIdentity(): any;
        isNonZero(): any;
        isSingular(): boolean;
    }
}
