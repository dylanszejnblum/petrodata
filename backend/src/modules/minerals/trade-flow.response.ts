import { ApiProperty } from '@nestjs/swagger';

export class TradeFlowEdgeDto {
  @ApiProperty({ example: 'Canadá' }) country!: string;
  @ApiProperty({ example: 29747 }) value_usd!: number;
}

export class TradeFlowDto {
  @ApiProperty({ example: 'Uranio' }) mineral!: string;
  @ApiProperty({ example: 2024, nullable: true, description: 'The requested year, or null when aggregated across all years.' }) year!: number | null;
  @ApiProperty({ type: [TradeFlowEdgeDto], description: 'Exporting countries → Argentina, sorted by value descending.' }) imports!: TradeFlowEdgeDto[];
  @ApiProperty({ type: [TradeFlowEdgeDto], description: 'Argentina → importing countries, sorted by value descending.' }) exports!: TradeFlowEdgeDto[];
  @ApiProperty({ example: 30712 }) total_import_usd!: number;
  @ApiProperty({ example: 1500 }) total_export_usd!: number;
  @ApiProperty({ example: -29212, description: 'total_export_usd − total_import_usd. Negative = trade deficit.' }) balance_usd!: number;
  @ApiProperty({ type: [Number], example: [1994, 1995, 2024], description: 'Years with trade data for this mineral (for year-slider bounds).' }) available_years!: number[];
}
