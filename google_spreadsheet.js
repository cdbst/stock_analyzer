const { google } = require('googleapis');

const enum_stock_types = {
    NORMAL : '1JRkKLvUePsNEzSe2yW7Fz4BrXxmyCivdzXQI0L0QylE',
    FINANCE : '1t_dNbefojsdih9P0ZZ4inEX3Zf8M623O2u_2_dWkh-U',
    REITS : '113X2f5R284SPQlXkq_NIPaPax7p1ybxzC6LBzSSRQi0'
};

const g_sheet_rows_map = {
    common : {
        url :'!A1', // URL
        tiker :'!A3', // 티커
        accounting_base_date : '!B9:G9', // 회계기준일자
    },
    normal : {
        income_states_segment : {
            '!B10:G10' : 'Total Revenues', // 매출액
            '!B12:G12' : 'Operating Income', // 영업이익
            '!B15:G15' : 'Net Interest Expenses', // 이자수익(비용)
            '!B17:G17' : 'Net Income', // 순이익
            '!B19:G19' : 'EBITDA', // EBITDA
        },
        balance_sheet_segment : {
            '!B21:G21' : 'Total Assets', // 자산
            '!B22:G22' : 'Total Liabilities', // 부채
            '!B24:G24' : 'Total Common Equity',  // 보통주지분
            '!B25:G25' : 'Minority Interest', // 우선주지분
            '!B26:G26' : 'Total Shares Out. on Filing Date', // 발행주식수
            '!B27:G27' : 'Total Cash & ST Investments', // 현금성자산
            '!B28:G28' : 'Total Current Assets', // 유동자산
            '!B29:G29' : 'Total Current Liabilities', // 유동부채
            '!B31:G31' : 'Inventory', // 재고자산
            '!B32:G32' : 'Accounts Receivable', // 매출채권
            '!B33:G33' : 'Accounts Payable', // 매입채무
        },
        cashflow_segment : {
            '!B35:G35' : 'Cash from Operations', // 영업활동 현금흐름 
            '!B37:G37' : 'Capital Expenditure', // CAPEX
            '!B38:G38' : 'Levered Free Cash Flow', // Levered FCF
            '!B39:G39' : 'Free Cash Flow / Share', // FCF / share
            '!B41:G41' : 'Common & Preferred Stock Dividends Paid', // 배당 지출
            '!B43:G43' : 'Repurchase of Common Stock', // 보통주 매입
            '!B44:G44' : 'Issuance of Common Stock', // 보통주발행 수익
            '!B46:G45' : 'Repurchase of Preferred Stock', // 우선주 매입
            '!B46:G46' : 'Issuance of Preferred Stock'// 우선주발행 수익
        }
    },
    reits : {
        income_states_segment : {
            '!B10:G10' : 'Total Revenues', // 매출액
            '!B12:G12' : 'Operating Income', // 운영수익
            '!B14:G14' : 'Earnings From Continuing Operations', // 지속운영수익
            '!B16:G16' : 'FFO', // FFO
            '!B19:G19' : 'AFFO', // AFFO
            '!B22:G22' : 'EBITDA',// EBITDA
            '!B24:G24' : 'EBITDAR', // EBITDAR
            '!B57:G57' : 'Rental Revenue', // 임대수익
            '!B58:G58' : 'Property Expenses', // 임대지출
            '!B59:G59' : 'Net Interest Expenses', // 순이자비용
            '!B62:G62' : 'FFO Per Share (Diluted)', // FFO/Share
            '!B63:G63' : 'Adjusted FFO Per Share (Diluted)' // AFFO/Share
        },
        balance_sheet_segment : {
            '!B26:G26' : 'Total Assets', // 자산
            '!B27:G27' : 'Total Liabilities', // 부채
            '!B29:G29' : 'Total Common Equity', // 보통주지분
            '!B30:G30' : 'Total Preferred Equity',  // 우선주지분
            '!B31:G31' : 'Total Shares Out. on Filing Date', // 발행주식수
            '!B32:G32' : 'Total Real Estate Assets', // 부동산자산
            '!B33:G33' : 'Cash And Equivalents', // 현금성 자산
            '!B34:G34' : 'Accounts Receivable', // 매출채권
            '!B35:G35' : 'Other Current Assets', // 기타 유동자산
            '!B36:G36' : 'Deferred Charges Long-Term', // 장기 이연요금
            '!B38:G38' : 'Accounts Payable', // 매입채무
            '!B39:G39' : 'Accrued Expenses', // 미지급비용
            '!B40:G40' : 'Current Portion of LT Debt', // CPLTD
            '!B41:G41' : 'Other Current Liabilities' // 기타 유동부채
        },
        cashflow_segment : {
            '!B45:G45' : 'Cash from Operations', // 영업활동 현금흐름
            '!B47:G47' : 'Acquisition of Real Estate Assets', // CAPEX
            '!B48:G48' : 'Common & Preferred Stock Dividends Paid', // 배당지출
            '!B50:G50' : 'Issuance of Common Stock', // 보통주 발행 수익
            '!B51:G51' : 'Repurchase of Common Stock', // 보통주 매입
            '!B52:G52' : 'Issuance of Preferred Stock', // 우선주 발행 수익
            '!B53:G53' : 'Repurchase of Preferred Stock', // 우선주 매입    
            '!B54:G54' : 'Levered Free Cash Flow', // Levered FCF
            '!B55:G55' : 'Free Cash Flow / Share' // FCF/Share
        }
    },
    finance : {
        income_states_segment : {
            '!B10:G10' : 'Total Interest Income', // 이자 수익
            '!B11:G11' : 'Total Interest Expense', // 이자 비용
            '!B15:G15' : 'Total Non Interest Income', // 비이자 수익
            '!B17:G17' : 'Provision For Loan Losses', // 대손충당금
            '!B19:G19' : 'Total Non Interest Expense', // 총 운영비용
            '!B22:G22' : 'Net Income', // 순이익
        },
        balance_sheet_segment : {
            '!B25:G25' : 'Total Assets', // 자산
            '!B26:G26' : 'Total Liabilities', // 부채
            '!B28:G28' : 'Total Common Equity', // 보통주지분
            '!B29:G29' : 'Total Preferred Equity', // 우선주지분
            '!B30:G30' : 'Total Shares Out. on Filing Date', // 발행주식수
            '!B31:G31' : 'Cash And Equivalents', // 현금성자산
            '!B32:G32' : 'Total Investments', // 총 투자자산
            '!B33:G33' : 'Net Loans', // 총 대출
            '!B34:G34' : 'Total Deposits', // 예금
            '!B35:G35' : 'Short-Term Borrowings', // 단기 차입금
            '!B36:G36' : 'Long-Term Debt', // 장기 차입금
            '!B37:G37' : 'Other Current Liabilities', // 기타 유동 부채
            '!B38:G38' : 'Other Non Current Liabilities', // 기타 비유동 부채
        },
        cashflow_segment : {
            '!B40:G40' : 'Cash from Operations', // 영업활동 현금흐름
            '!B42:G42' : 'Cash from Investing', // 투자활동 현금흐름
            '!B44:G44' : 'Cash from Financing', // 재무활동 현금흐름
            '!B46:G46' : 'Free Cash Flow / Share', // FCF/Share
            '!B48:G48' : 'Common & Preferred Stock Dividends Paid', // 배당지출
            '!B50:G50' : 'Repurchase of Common Stock', // 보통주매입
            '!B51:G51' : 'Repurchase of Preferred Stock', // 우선주매입
            '!B52:G52' : 'Issuance of Common Stock', // 보통주발행 수익
            '!B53:G53' : 'Issuance of Preferred Stock' // 우선주발행 수익
        }
    }
};

const FINANCE_REFERENCE_URL = 'https://seekingalpha.com/symbol/';

class SheetOperator {

    constructor(_stock_type, _sheet_name, _auth){
        this.auth = _auth;
        this.sheet_name = _sheet_name;
        this.sheet_row_map = undefined;
        this.sheet_id = _stock_type;

        if(_stock_type == enum_stock_types.NORMAL){
            this.sheet_row_map = g_sheet_rows_map.normal;
        }else if(_stock_type == enum_stock_types.FINANCE){
            this.sheet_row_map = g_sheet_rows_map.finance;
        }else if(_stock_type == enum_stock_types.REITS){
            this.sheet_row_map = g_sheet_rows_map.reits;
        }else{
            console.log('construction is failed : invalid sheet type.');
        }
    }

    get_sheet_data(__callback){

        const auth = this.auth;

        if(auth == undefined){
            console.log('auth is not set condition');
            __callback('auth is not set condition');
            return;
        }
    
        var sheets = google.sheets({ version: 'v4', auth });
    
        sheets.spreadsheets.values.get({
            spreadsheetId: this.sheet_id,
            range: this.sheet_name,
        }, (err, res) => {
    
            if (err){
                console.log('fail : getting sheet information (api err) ' + err);
                __callback(err);
                return;
            }
    
            const rows = res.data.values;
    
            if (rows.length){
                __callback(undefined, rows);
                return;
            }else{
                console.log('sheet information is empty');
                __callback('sheet information is empty');
                return;
            }
        });
    }

    cleanup_sheet(__callback){

        const auth = this.auth;

        var sheets = google.sheets({ version: 'v4', auth });

        var resources = {
            auth: auth,
            spreadsheetId: this.sheet_id,
            resource:{
                valueInputOption: "RAW",
                data: this.build_sheet_cleanup_data()
            }
        };
    
        sheets.spreadsheets.values.batchUpdate(resources, (err, result)=>{
            if(err){
                __callback(err);
                return;
            }
            __callback(undefined, result);
        });
    }

    build_sheet_cleanup_data(){

        var cleanup_data = [];
        var row_segments = Object.keys(this.sheet_row_map);
        var cleanup_sheet_ranges = [];

        cleanup_sheet_ranges.push.apply(cleanup_sheet_ranges, Object.values(g_sheet_rows_map.common));


        row_segments.forEach((row_segment) =>{
            var row_ranges = Object.keys(this.sheet_row_map[row_segment]);
            cleanup_sheet_ranges.push.apply(cleanup_sheet_ranges, row_ranges);
        });

        cleanup_sheet_ranges.forEach((_range) =>{
    
            var val = undefined;
    
            if(_range.includes(':')){
                val = [[0, 0, 0, 0, 0, 0]];
            }else{
                val = [['']];
            }
    
            cleanup_data.push({
                range: this.sheet_name + _range, 
                values: val
            });
        });
    
        return cleanup_data;
    }

    update_sheet(tiker, income_state_datas, balance_sheet_datas, cash_flow_datas, __callback){

        const auth = this.auth;

        var sheets = google.sheets({ version: 'v4', auth });
    
        var resources = {
            auth: auth,
            spreadsheetId: this.sheet_id,
            resource:{
                valueInputOption: "RAW",
                data: this.build_sheet_data(tiker, income_state_datas, balance_sheet_datas, cash_flow_datas) // TODO: FIX;
            }
        };
    
        sheets.spreadsheets.values.batchUpdate(resources, (err, result)=>{
            if(err){
                __callback(err);
                return;
            }
            __callback(undefined, result);
        });
    }

    build_sheet_data(tiker, income_state_datas, balance_sheet_datas, cash_flow_datas){

        var update_datas = [];

        if(income_state_datas.length == 0 || balance_sheet_datas.length == 0 || cash_flow_datas.length == 0){
            return update_datas;
        }

        var accounting_base_dates = this.get_accounting_base_dates(income_state_datas);

        //Setting up common datas
        update_datas.push(
            {
                range: this.sheet_name + g_sheet_rows_map.common.url, //TODO: URL
                values: [[FINANCE_REFERENCE_URL + tiker]]
            },
            {
                range: this.sheet_name + g_sheet_rows_map.common.tiker, //TODO: TIKER
                values: [[tiker]]
            },
            {
                range: this.sheet_name + g_sheet_rows_map.common.accounting_base_date, //TODO: 회계기준일자
                values: [accounting_base_dates]
            },
        );

        
        for (const [segment, ranges] of Object.entries(this.sheet_row_map)){

            var data_set = undefined;

            if(segment == 'income_states_segment'){
                data_set = income_state_datas;
            }else if(segment == 'balance_sheet_segment'){
                data_set = balance_sheet_datas;
            }else if(segment == 'cashflow_segment'){
                data_set = cash_flow_datas;
            }else{
                console.error('invalid segment type');
                continue;
            }

            for (const [range, data_key] of Object.entries(ranges)){
                var row_datas = this.get_row_datas(accounting_base_dates, data_set, this.find_row_idx(data_key, data_set.data));
                update_datas.push({
                    range: this.sheet_name + range,
                    values: [row_datas]
                });
            }
        }
    
        return update_datas;
    }

    /**
     * @description 데이터 표본에서 회계기준일을 취득함.
     * 
     * @param {object} sample_datas 샘플데이터.
     * 
     * @returns {list} 샘플 데이터상에 존재하는 복수개의 회계기준일을 리스트로 반환함.
     */
    get_accounting_base_dates(sample_datas){
        var accounting_base_dates = [];
    
        var sample_data_list = sample_datas.data[0][0];
    
        sample_data_list.forEach(sample_data => {
    
            if('headerClass' in sample_data) return;
            
            if(sample_data['name'] == 'TTM'){
                accounting_base_dates.push('TTM');
                return;
            }
    
            var month_year_pair = sample_data['name'].split(' ');
    
            if(month_year_pair.length != 2) return;
            if(sample_data['value'].includes('<svg')) return;
            
            accounting_base_dates.push(sample_data['name']);
        });
    
        return accounting_base_dates;
    }

    get_row_datas(accounting_base_dates, data_set, row_idx){
        var row_datas = [];
    
        if(row_idx.superset == -1 || row_idx.sub_set == -1){
            return row_datas;
        }
    
        var row_data_list = data_set.data[row_idx.superset][row_idx.subset];
    
        row_data_list.forEach(row_data => {

            var row_data_name = row_data['name'].trim();
            var accounting_base_date = undefined;
    
            if(row_data_name == 'Last Report'){
                row_data_name = 'TTM';
            }
    
            if(row_data_name != 'TTM'){
                var month_year_pair = row_data_name.split(' ');
                if(month_year_pair.length != 2) return;
                accounting_base_date = row_data_name;
            }else{
                accounting_base_date = 'TTM';
            }
    
            if(accounting_base_dates.includes(accounting_base_date) == false) return;
    
            if(row_data['value'].includes('<svg')) return;
            
            var cell_data = row_data['value'];
            if(cell_data.includes('(') && cell_data.includes(')')){ //negative val
                cell_data = cell_data.replace(/\(/g, '');
                cell_data = cell_data.replace(/\)/g, '');
                cell_data = '-' + cell_data;
            }
            if(cell_data == '-'){ // unknown data
                cell_data = '0';
            }
            
            cell_data = cell_data.replace(/\$/g, '');
            cell_data = cell_data.replace(/,/g, '');
            cell_data = parseFloat(cell_data);
    
            row_datas.push(cell_data);
        });
    
        return row_datas;
    }

    find_row_idx(row_col_str, data_set){

        for(var i = 0; i < data_set.length; i++){
            var superset = data_set[i];
    
            for(var j = 0; j < superset.length; j++){
                var sub_set = superset[j];
    
                if(sub_set[0]['value'].trim() == row_col_str.trim()){
                    return {
                        superset : i,
                        subset : j
                    }
                }
            }
        }
    
        return {
            superset : -1,
            subset : -1
        };
    }
}

function setup_data_into_sheet(_sheet_auth, _stock_type, _sheet_name, _tiker, _income_state_data, _balance_sheet_data, _cashflow_data, __callback){

    //Sheet operator for annually data.
    sheet_operator = new SheetOperator(_stock_type, _sheet_name, _sheet_auth);

    sheet_operator.cleanup_sheet((err)=>{
        if(err){
            console.error('fail : cleanup sheet\n' + err);
            __callback(err);
            return;
        }

        sheet_operator.update_sheet(_tiker, _income_state_data, _balance_sheet_data, _cashflow_data, (err)=>{

            if(err){
                console.error('fail : updating sheet\n' + err);
                __callback(err);
                return;
            }

            __callback(undefined);
        });
    });
}

module.exports.enum_stock_types = enum_stock_types;
module.exports.SheetOperator = SheetOperator;
module.exports.setup_data_into_sheet = setup_data_into_sheet;


// sample data
    // data:[
    //     {
    //         range: g.sheet_name + "!A3", // Update single cell
    //         values: [[tiker]]
    //     }, 
    //     // {
    //     //     range: "Sheet1!B4:B6", // Update a column
    //     //     values: [["B4"], ["B5"], ["B6"]]
    //     // }, 
    //     // {
    //     //     range: "Sheet1!C4:E4", // Update a row
    //     //     values: [["C4", "D4", "E4"]]
    //     // }, 
    //     // {
    //     //     range: "Sheet1!F5:H6", // Update a 2d range
    //     //     values: [["F5", "F5"], ["H6", "H6"]]
    //     // }
    // ]