<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; font-size: 10px; color: #0b1c30; }
  .header { display: flex; justify-content: space-between; border-bottom: 2px solid #012d1d; padding-bottom: 10px; margin-bottom: 14px; }
  .farm { font-size: 16px; font-weight: bold; color: #012d1d; }
  .report-title { font-size: 12px; font-weight: bold; margin-top: 3px; }
  .meta { text-align: right; font-size: 9px; color: #717973; }
  table { width: 100%; border-collapse: collapse; }
  th { background: #012d1d; color: white; padding: 5px 7px; text-align: left; font-size: 9px; font-weight: bold; text-transform: uppercase; }
  td { padding: 4px 7px; border-bottom: 1px solid #e5eeff; font-size: 9px; }
  tr:nth-child(even) td { background: #f4f7f4; }
  .footer { margin-top: 16px; padding-top: 8px; border-top: 1px solid #c1c8c2; font-size: 8px; color: #717973; display: flex; justify-content: space-between; }
</style>
</head>
<body>
  <div class="header">
    <div>
      <div class="farm">GreenValley Poultry Farm</div>
      <div class="report-title">{{ $title }}</div>
    </div>
    <div class="meta">
      <div>Generated: {{ $generated }}</div>
      @if($dateFrom)
      <div>Period: {{ $dateFrom }} to {{ $dateTo }}</div>
      @endif
    </div>
  </div>

  <table>
    <thead>
      <tr>@foreach($headers as $h)<th>{{ $h }}</th>@endforeach</tr>
    </thead>
    <tbody>
      @forelse($rows as $row)
      <tr>@foreach((array)$row as $cell)<td>{{ $cell }}</td>@endforeach</tr>
      @empty
      <tr><td colspan="{{ count($headers) }}" style="text-align:center;color:#717973;padding:16px">No data for selected period</td></tr>
      @endforelse
    </tbody>
  </table>

  <div class="footer">
    <span>PoultryFarm Pro ERP</span>
    <span>Confidential — For internal use only</span>
    <span>Page 1</span>
  </div>
</body>
</html>
