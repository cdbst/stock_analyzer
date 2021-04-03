const { google } = require('googleapis');

var enum_sheet_types = {
    SPREADSHEET_ID_NORMAL : '1JRkKLvUePsNEzSe2yW7Fz4BrXxmyCivdzXQI0L0QylE',
    SPREADSHEET_ID_FINANCE : '1t_dNbefojsdih9P0ZZ4inEX3Zf8M623O2u_2_dWkh-U',
    SPREADSHEET_ID_REITS : '113X2f5R284SPQlXkq_NIPaPax7p1ybxzC6LBzSSRQi0'
}

const normal_sheet_ranges = [
    '!A1',
    '!A3', // 티커
    '!H8', // Month end
    '!B9:G9', // 연도
    '!B10:G10', // 매출액
    '!B12:G12', // 영업이익
    '!B15:G15', // 이자수익(비용)
    '!B17:G17', // 순이익
    '!B19:G19', // EBITDA
    '!B21:G21', // 자산
    '!B22:G22', // 부채
    '!B24:G24', // 보통주지분
    '!B25:G25', // 우선주지분
    '!B26:G26', // 발행주식수
    '!B27:G27', // 현금성자산
    '!B28:G28', // 유동자산
    '!B29:G29', // 유동부채
    '!B31:G31', // 재고자산
    '!B32:G32', // 매출채권
    '!B33:G33', // 매입채무
    '!B35:G35', // 영업활동 현금흐름 
    '!B37:G37', // CAPEX
    '!B38:G38', // Levered FCF
    '!B39:G39', // FCF / share
    '!B41:G41', // 배당 지출
    '!B43:G43', // 보통주 매입
    '!B44:G44', // 보통주발행 수익
    '!B46:G45', // 우선주 매입
    '!B46:G46', // 우선주발행 수익
];

const finance_sheet_ranges = [
    '!A1',
    '!A3', // tiker
    '!H8', // month end 
    '!B9:G9', // year : row header
    '!B10:G10', // 이자 수익
    '!B11:G11', // 이자 비용
    '!B15:G15', // 비이자 수익
    '!B17:G17', // 대손충당금
    '!B19:G19', // 총 운영비용
    '!B22:G22', // 순이익
    '!B25:G25', // 자산
    '!B26:G26', // 부채
    '!B28:G28', // 보통주지분
    '!B29:G29', // 우선주지분
    '!B30:G30', // 발행주식수
    '!B31:G31', // 현금성자산
    '!B32:G32', // 총 투자자산
    '!B33:G33', // 총 대출
    '!B34:G34', // 예금
    '!B35:G35', // 단기 차입금
    '!B36:G36', // 장기 차입금
    '!B37:G37', // 기타 유동 부채
    '!B38:G38', // 기타 비유동 부채
    '!B40:G40', // 영업활동 현금흐름
    '!B42:G42', // 투자활동 현금흐름
    '!B44:G44', // 재무활동 현금흐름
    '!B46:G46', // FCF/Share
    '!B48:G48', // 배당지출
    '!B50:G50', // 보통주매입
    '!B51:G51', // 우선주매입
    '!B52:G52', // 보통주발행 수익
    '!B53:G53' // 우선주발행 수익
];

const reits_sheet_ranges = [
    '!A1',
    '!A3', // tiker
    '!H8', // month end 
    '!B9:G9', // year : row header
    '!B10:G10', // 매출액
    '!B12:G12', // 운영수익
    '!B14:G14', // 지속운영수익
    '!B16:G16', // FFO
    '!B19:G19', // AFFO
    '!B22:G22', // EBITDA
    '!B24:G24', // EBITDAR
    '!B26:G26', // 자산
    '!B27:G27', // 부채
    '!B29:G29', // 보통주지분
    '!B30:G30', // 우선주지분
    '!B31:G31', // 발행주식수
    '!B32:G32', // 부동산자산
    '!B33:G33', // 현금성 자산
    '!B34:G34', // 매출채권
    '!B35:G35', // 기타 유동자산
    '!B36:G36', // 장기 이연요금
    '!B38:G38', // 매입채무
    '!B39:G39', // 미지급비용
    '!B40:G40', // CPLTD
    '!B41:G41', // 기타 유동부채
    '!B45:G45', // 영업활동 현금흐름
    '!B47:G47', // CAPEX
    '!B48:G48', // 배당지출
    '!B50:G50', // 보통주 발행 수익
    '!B51:G51', // 보통주 매입
    '!B52:G52', // 우선주 발행 수익
    '!B53:G53', // 우선주 매입    
    '!B54:G54', // Levered FCF
    '!B55:G55', // FCF/Share
    '!B57:G57', // 임대수익
    '!B58:G58', // 임대지출
    '!B59:G59', // 순이자비용
    '!B62:G62', // FFO/Share
    '!B63:G63', // AFFO/Share
];

const YAHOO_FINANCE_URL = 'https://finance.yahoo.com/quote/';

var g = {};
g.sheet_name = 'summary';

function get_sheet(auth, sheet_id, __callback){

    if(auth == undefined){
        console.log('auth is not set condition');
        __callback('auth is not set condition');
        return;
    }

    var sheets = google.sheets({ version: 'v4', auth });

    sheets.spreadsheets.values.get({
        spreadsheetId: sheet_id,
        range: 'summary',
    }, (err, res) => {

        if (err){
            console.log('fail with getting spc_list from google server (api err) ' + err);
            __callback(err);
            return;
        }

        const rows = res.data.values;

        if (rows.length){
            console.log('success with setting up spc sheet information');
            __callback(undefined);
            return;
        }else{
            
            console.log('spc sheet information is empty');
            __callback('spc sheet information is empty');
            return;
        }
    });
}

function cleanup_sheet(auth, sheet_id, __callback){

    var sheets = google.sheets({ version: 'v4', auth });

    var cleanup_datas = [];

    if(sheet_id == enum_sheet_types.SPREADSHEET_ID_NORMAL){
        cleanup_datas = build_normal_sheet_cleanup_data();
    }else if(sheet_id == enum_sheet_types.SPREADSHEET_ID_REITS){
        cleanup_datas = build_reits_sheet_cleanup_data()
    }else if(sheet_id == enum_sheet_types.SPREADSHEET_ID_FINANCE){
        cleanup_datas = build_finance_sheet_cleanup_data();
    }else{
        __callback('undefiend sheet type in update_sheet');
        return;
    }

    var resources = {
        auth: auth,
        spreadsheetId: sheet_id,
        resource:{
            valueInputOption: "RAW",
            data: cleanup_datas
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

function update_sheet(auth, sheet_id, tiker, income_state_datas, balance_sheet_datas, cash_flow_datas, __callback){

    var sheets = google.sheets({ version: 'v4', auth });

    var update_datas = undefined;
    
    if(sheet_id == enum_sheet_types.SPREADSHEET_ID_NORMAL){
        update_datas = build_normal_sheet_data(tiker, income_state_datas, balance_sheet_datas, cash_flow_datas);
    }else if(sheet_id == enum_sheet_types.SPREADSHEET_ID_REITS){
        update_datas = build_reits_sheet_data(tiker, income_state_datas, balance_sheet_datas, cash_flow_datas);
    }else if(sheet_id == enum_sheet_types.SPREADSHEET_ID_FINANCE){
        update_datas = build_finance_sheet_data(tiker, income_state_datas, balance_sheet_datas, cash_flow_datas);
    }else{
        __callback('undefiend sheet type in update_sheet');
        return;
    }

    var resources = {
        auth: auth,
        spreadsheetId: sheet_id,
        resource:{
            valueInputOption: "RAW",
            data: update_datas
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

function build_normal_sheet_data(tiker, income_state_datas, balance_sheet_datas, cash_flow_datas){

    var update_datas = [];

    if(income_state_datas.length == 0 || balance_sheet_datas.length == 0 || cash_flow_datas.length == 0){
        return update_datas;
    }

    var cell_datas = [];

    var month_end = get_month_end(income_state_datas);
    var years = get_years(income_state_datas);
    var total_revenues = get_row_datas(years, income_state_datas, find_row_idx('Total Revenues', income_state_datas.data));
    var operating_incomes = get_row_datas(years, income_state_datas, find_row_idx('Operating Income', income_state_datas.data));
    var net_interest_expenses = get_row_datas(years, income_state_datas, find_row_idx('Net Interest Expenses', income_state_datas.data));
    var net_incomes = get_row_datas(years, income_state_datas, find_row_idx('Net Income', income_state_datas.data));
    var ebitdas = get_row_datas(years, income_state_datas, find_row_idx('EBITDA', income_state_datas.data));

    var total_assets = get_row_datas(years, balance_sheet_datas, find_row_idx('Total Assets', balance_sheet_datas.data));
    var total_liabilities = get_row_datas(years, balance_sheet_datas, find_row_idx('Total Liabilities', balance_sheet_datas.data));
    var total_common_equity = get_row_datas(years, balance_sheet_datas, find_row_idx('Total Common Equity', balance_sheet_datas.data));
    var minority_interest = get_row_datas(years, balance_sheet_datas, find_row_idx('Minority Interest', balance_sheet_datas.data)); // 우선주 지분
    var total_shares_outstanding = get_row_datas(years, balance_sheet_datas, find_row_idx('Total Shares Out. on Filing Date', balance_sheet_datas.data)); // 발행주식수

    var total_cash_n_st_investments = get_row_datas(years, balance_sheet_datas, find_row_idx('Total Cash & ST Investments', balance_sheet_datas.data));
    var total_current_assets = get_row_datas(years, balance_sheet_datas, find_row_idx('Total Current Assets', balance_sheet_datas.data));
    var total_current_liabilities = get_row_datas(years, balance_sheet_datas, find_row_idx('Total Current Liabilities', balance_sheet_datas.data));

    var inventory = get_row_datas(years, balance_sheet_datas, find_row_idx('Inventory', balance_sheet_datas.data));
    var accounts_receivable = get_row_datas(years, balance_sheet_datas, find_row_idx('Accounts Receivable', balance_sheet_datas.data));
    var accounts_payable = get_row_datas(years, balance_sheet_datas, find_row_idx('Accounts Payable', balance_sheet_datas.data));

    var cash_from_operations = get_row_datas(years, cash_flow_datas, find_row_idx('Cash from Operations', cash_flow_datas.data));
    var capex = get_row_datas(years, cash_flow_datas, find_row_idx('Capital Expenditure', cash_flow_datas.data));
    var levered_free_cash_flow = get_row_datas(years, cash_flow_datas, find_row_idx('Levered Free Cash Flow', cash_flow_datas.data));
    var fcf_per_shares = get_row_datas(years, cash_flow_datas, find_row_idx('Free Cash Flow / Share', cash_flow_datas.data));
    var dividends_paids = get_row_datas(years, cash_flow_datas, find_row_idx('Common & Preferred Stock Dividends Paid', cash_flow_datas.data));
    var repurchase_paids_of_common_stock = get_row_datas(years, cash_flow_datas, find_row_idx('Repurchase of Common Stock', cash_flow_datas.data));
    var issuance_of_common_stock = get_row_datas(years, cash_flow_datas, find_row_idx('Issuance of Common Stock', cash_flow_datas.data));
    var repurchase_paids_of_preferred_stock = get_row_datas(years, cash_flow_datas, find_row_idx('Repurchase of Preferred Stock ', cash_flow_datas.data));
    var issuance_of_preferred_stock = get_row_datas(years, cash_flow_datas, find_row_idx('Issuance of Preferred Stock ', cash_flow_datas.data));

    cell_datas.push( // 반드시 순서대로 넣어야 함.
        [YAHOO_FINANCE_URL + tiker],
        [tiker],
        ['<Month end : ' + month_end + '>'],
        years,
        total_revenues,
        operating_incomes,
        net_interest_expenses,
        net_incomes,
        ebitdas,
        total_assets,
        total_liabilities,
        total_common_equity,
        minority_interest,
        total_shares_outstanding,
        total_cash_n_st_investments,
        total_current_assets,
        total_current_liabilities,
        inventory,
        accounts_receivable,
        accounts_payable,
        cash_from_operations,
        capex,
        levered_free_cash_flow,
        fcf_per_shares,
        dividends_paids,
        repurchase_paids_of_common_stock,
        issuance_of_common_stock,
        repurchase_paids_of_preferred_stock,
        issuance_of_preferred_stock
    );

    for(var i = 0; i < normal_sheet_ranges.length; i++){
        var range = normal_sheet_ranges[i];
        var cell_data = cell_datas[i];

        update_datas.push({
            range: g.sheet_name + range, // TIKER
            values: [cell_data]
        });
    }

    return update_datas;
}

function build_normal_sheet_cleanup_data(){

    var cleanup_data = [];

    normal_sheet_ranges.forEach((_range) =>{

        var val = undefined;

        if(_range.includes(':')){
            val = [[0, 0, 0, 0, 0, 0]];
        }else{
            val = [['']];
        }

        cleanup_data.push({
            range: g.sheet_name + _range, 
            values: val
        });
    });

    return cleanup_data;
}

function build_finance_sheet_data(tiker, income_state_datas, balance_sheet_datas, cash_flow_datas){

    var update_datas = [];

    if(income_state_datas.length == 0 || balance_sheet_datas.length == 0 || cash_flow_datas.length == 0){
        return update_datas;
    }

    var cell_datas = [];

    var month_end = get_month_end(income_state_datas);
    var years = get_years(income_state_datas);
    var total_interest_income = get_row_datas(years, income_state_datas, find_row_idx('Total Interest Income', income_state_datas.data));
    var total_interest_expense = get_row_datas(years, income_state_datas, find_row_idx('Total Interest Expense', income_state_datas.data));
    var total_non_interest_income = get_row_datas(years, income_state_datas, find_row_idx('Total Non Interest Income', income_state_datas.data));
    var provision_for_loan_losses = get_row_datas(years, income_state_datas, find_row_idx('Provision For Loan Losses', income_state_datas.data));
    var total_non_interest_expenses = get_row_datas(years, income_state_datas, find_row_idx('Total Non Interest Expense', income_state_datas.data));
    var net_income = get_row_datas(years, income_state_datas, find_row_idx('Net Income', income_state_datas.data));

    var total_assets = get_row_datas(years, balance_sheet_datas, find_row_idx('Total Assets', balance_sheet_datas.data));
    var total_liabilities = get_row_datas(years, balance_sheet_datas, find_row_idx('Total Liabilities', balance_sheet_datas.data));
    var total_common_equity = get_row_datas(years, balance_sheet_datas, find_row_idx('Total Common Equity', balance_sheet_datas.data));
    var total_preferred_equity = get_row_datas(years, balance_sheet_datas, find_row_idx('Total Preferred Equity', balance_sheet_datas.data));
    var total_shares_outstanding = get_row_datas(years, balance_sheet_datas, find_row_idx('Total Shares Out. on Filing Date', balance_sheet_datas.data));
    var cash_n_equivalents = get_row_datas(years, balance_sheet_datas, find_row_idx('Cash And Equivalents', balance_sheet_datas.data));
    var total_investments = get_row_datas(years, balance_sheet_datas, find_row_idx('Total Investments', balance_sheet_datas.data));
    var let_loans = get_row_datas(years, balance_sheet_datas, find_row_idx('Net Loans', balance_sheet_datas.data));
    var total_deposits = get_row_datas(years, balance_sheet_datas, find_row_idx('Total Deposits', balance_sheet_datas.data));
    var short_term_borrowings = get_row_datas(years, balance_sheet_datas, find_row_idx('Short-Term Borrowings', balance_sheet_datas.data));
    var long_term_debt = get_row_datas(years, balance_sheet_datas, find_row_idx('Long-Term Debt', balance_sheet_datas.data));

    var other_current_liabilities = get_row_datas(years, balance_sheet_datas, find_row_idx('Other Current Liabilities ', balance_sheet_datas.data));
    var other_non_current_liabilities = get_row_datas(years, balance_sheet_datas, find_row_idx('Other Non Current Liabilities', balance_sheet_datas.data));

    var cash_from_operations = get_row_datas(years, cash_flow_datas, find_row_idx('Cash from Operations', cash_flow_datas.data));
    var cash_from_investing = get_row_datas(years, cash_flow_datas, find_row_idx('Cash from Investing', cash_flow_datas.data));
    var cash_from_financing = get_row_datas(years, cash_flow_datas, find_row_idx('Cash from Financing', cash_flow_datas.data));
    var fcf_per_shares = get_row_datas(years, cash_flow_datas, find_row_idx('Free Cash Flow / Share', cash_flow_datas.data));
    var dividends_paids = get_row_datas(years, cash_flow_datas, find_row_idx('Common & Preferred Stock Dividends Paid', cash_flow_datas.data));
    var repurchase_paids_of_common_stock = get_row_datas(years, cash_flow_datas, find_row_idx('Repurchase of Common Stock', cash_flow_datas.data));
    var repurchase_paids_of_preferred_stock = get_row_datas(years, cash_flow_datas, find_row_idx('Repurchase of Preferred Stock ', cash_flow_datas.data));
    var issuance_of_common_stock = get_row_datas(years, cash_flow_datas, find_row_idx('Issuance of Common Stock', cash_flow_datas.data));
    var issuance_of_preferred_stock = get_row_datas(years, cash_flow_datas, find_row_idx('Issuance of Preferred Stock ', cash_flow_datas.data));

    cell_datas.push( // 반드시 순서대로 넣어야 함.
        [YAHOO_FINANCE_URL + tiker],
        [tiker],
        ['<Month end : ' + month_end + '>'],
        years,
        total_interest_income,
        total_interest_expense,
        total_non_interest_income,
        provision_for_loan_losses,
        total_non_interest_expenses,
        net_income,
        total_assets,
        total_liabilities,
        total_common_equity,
        total_preferred_equity,
        total_shares_outstanding,
        cash_n_equivalents,
        total_investments,
        let_loans,
        total_deposits,
        short_term_borrowings,
        long_term_debt,
        other_current_liabilities,
        other_non_current_liabilities,
        cash_from_operations,
        cash_from_investing,
        cash_from_financing,
        fcf_per_shares,
        dividends_paids,
        repurchase_paids_of_common_stock,
        repurchase_paids_of_preferred_stock,
        issuance_of_common_stock,
        issuance_of_preferred_stock
    );

    for(var i = 0; i < finance_sheet_ranges.length; i++){
        var range = finance_sheet_ranges[i];
        var cell_data = cell_datas[i];

        update_datas.push({
            range: g.sheet_name + range, // TIKER
            values: [cell_data]
        });
    }

    return update_datas;
}

function build_finance_sheet_cleanup_data(){

    var cleanup_data = [];

    finance_sheet_ranges.forEach((_range) =>{

        var val = undefined;

        if(_range.includes(':')){
            val = [[0, 0, 0, 0, 0, 0]];
        }else{
            val = [['']];
        }

        cleanup_data.push({
            range: g.sheet_name + _range, 
            values: val
        });
    });

    return cleanup_data;
}

function build_reits_sheet_data(tiker, income_state_datas, balance_sheet_datas, cash_flow_datas){

    var update_datas = [];

    if(income_state_datas.length == 0 || balance_sheet_datas.length == 0 || cash_flow_datas.length == 0){
        return update_datas;
    }

    var cell_datas = [];

    var month_end = get_month_end(income_state_datas);
    var years = get_years(income_state_datas);
    var total_revenues = get_row_datas(years, income_state_datas, find_row_idx('Total Revenues', income_state_datas.data));
    var operating_income = get_row_datas(years, income_state_datas, find_row_idx('Operating Income', income_state_datas.data));
    var earnings_from_continuing_operations = get_row_datas(years, income_state_datas, find_row_idx('Earnings From Continuing Operations', income_state_datas.data));

    var ffo = get_row_datas(years, income_state_datas, find_row_idx('FFO', income_state_datas.data));
    var affo = get_row_datas(years, income_state_datas, find_row_idx('AFFO', income_state_datas.data));
    var ebitda = get_row_datas(years, income_state_datas, find_row_idx('EBITDA', income_state_datas.data));
    var ebitdar = get_row_datas(years, income_state_datas, find_row_idx('EBITDAR', income_state_datas.data));

    var total_assets = get_row_datas(years, balance_sheet_datas, find_row_idx('Total Assets', balance_sheet_datas.data));
    var total_liabilities = get_row_datas(years, balance_sheet_datas, find_row_idx('Total Liabilities', balance_sheet_datas.data));
    var total_common_equity = get_row_datas(years, balance_sheet_datas, find_row_idx('Total Common Equity', balance_sheet_datas.data));
    var Total_preferred_equity = get_row_datas(years, balance_sheet_datas, find_row_idx('Total Preferred Equity', balance_sheet_datas.data));
    var total_shares_outstanding = get_row_datas(years, balance_sheet_datas, find_row_idx('Total Shares Out. on Filing Date', balance_sheet_datas.data));

    var total_real_estate_assets = get_row_datas(years, balance_sheet_datas, find_row_idx('Total Real Estate Assets', balance_sheet_datas.data));

    var cash_n_equivalents = get_row_datas(years, balance_sheet_datas, find_row_idx('Cash And Equivalents', balance_sheet_datas.data));
    var accounts_receivable = get_row_datas(years, balance_sheet_datas, find_row_idx('Accounts Receivable', balance_sheet_datas.data));
    var other_current_assets = get_row_datas(years, balance_sheet_datas, find_row_idx('Other Current Assets', balance_sheet_datas.data));
    var deferred_charges_long_term = get_row_datas(years, balance_sheet_datas, find_row_idx('Deferred Charges Long-Term', balance_sheet_datas.data));

    var accounts_payable = get_row_datas(years, balance_sheet_datas, find_row_idx('Accounts Payable', balance_sheet_datas.data));
    var accrued_expenses = get_row_datas(years, balance_sheet_datas, find_row_idx('Accrued Expenses', balance_sheet_datas.data));
    var cpltd = get_row_datas(years, balance_sheet_datas, find_row_idx('Current Portion of LT Debt', balance_sheet_datas.data));
    var other_current_liabilities = get_row_datas(years, balance_sheet_datas, find_row_idx('Other Current Liabilities', balance_sheet_datas.data));

    var cashflow_from_operations = get_row_datas(years, cash_flow_datas, find_row_idx('Cash from Operations', cash_flow_datas.data));
    var capex = get_row_datas(years, cash_flow_datas, find_row_idx('Acquisition of Real Estate Assets', cash_flow_datas.data));
    var dividends_paids = get_row_datas(years, cash_flow_datas, find_row_idx('Common & Preferred Stock Dividends Paid', cash_flow_datas.data));
    var issuance_of_common_stock = get_row_datas(years, cash_flow_datas, find_row_idx('Issuance of Common Stock', cash_flow_datas.data));
    var repurchase_paids_of_common_stock = get_row_datas(years, cash_flow_datas, find_row_idx('Repurchase of Common Stock', cash_flow_datas.data));
    var issuance_of_preferred_stock = get_row_datas(years, cash_flow_datas, find_row_idx('Issuance of Preferred Stock ', cash_flow_datas.data));
    var repurchase_paids_of_preferred_stock = get_row_datas(years, cash_flow_datas, find_row_idx('Repurchase of Preferred Stock ', cash_flow_datas.data));

    var levered_free_cashflow = get_row_datas(years, cash_flow_datas, find_row_idx('Levered Free Cash Flow', cash_flow_datas.data));
    var fcf_per_shares = get_row_datas(years, cash_flow_datas, find_row_idx('Free Cash Flow / Share', cash_flow_datas.data));

    var rental_revenue = get_row_datas(years, income_state_datas, find_row_idx('Rental Revenue', income_state_datas.data));
    var property_expenses = get_row_datas(years, income_state_datas, find_row_idx('Property Expenses', income_state_datas.data));
    var net_interest_expenses = get_row_datas(years, income_state_datas, find_row_idx('Net Interest Expenses', income_state_datas.data));

    var ffo_per_share = get_row_datas(years, income_state_datas, find_row_idx('FFO Per Share (Diluted)', income_state_datas.data));
    var affo_per_share = get_row_datas(years, income_state_datas, find_row_idx('Adjusted FFO Per Share (Diluted)', income_state_datas.data));

    cell_datas.push( // 반드시 순서대로 넣어야 함.
        [YAHOO_FINANCE_URL + tiker],
        [tiker],
        ['<Month end : ' + month_end + '>'],
        years,
        total_revenues,
        operating_income,
        earnings_from_continuing_operations,
        ffo,
        affo,
        ebitda,
        ebitdar,
        total_assets,
        total_liabilities,
        total_common_equity,
        Total_preferred_equity,
        total_shares_outstanding,
        total_real_estate_assets,
        cash_n_equivalents,
        accounts_receivable,
        other_current_assets,
        deferred_charges_long_term,
        accounts_payable,
        accrued_expenses,
        cpltd,
        other_current_liabilities,
        cashflow_from_operations,
        capex,
        dividends_paids,
        issuance_of_common_stock,
        repurchase_paids_of_common_stock,
        issuance_of_preferred_stock,
        repurchase_paids_of_preferred_stock,
        levered_free_cashflow,
        fcf_per_shares,
        rental_revenue,
        property_expenses,
        net_interest_expenses,
        ffo_per_share,
        affo_per_share
    );

    for(var i = 0; i < reits_sheet_ranges.length; i++){
        var range = reits_sheet_ranges[i];
        var cell_data = cell_datas[i];

        update_datas.push({
            range: g.sheet_name + range, // TIKER
            values: [cell_data]
        });
    }

    return update_datas;
}

function build_reits_sheet_cleanup_data(){

    var cleanup_data = [];

    reits_sheet_ranges.forEach((_range) =>{

        var val = undefined;

        if(_range.includes(':')){
            val = [[0, 0, 0, 0, 0, 0]];
        }else{
            val = [['']];
        }

        cleanup_data.push({
            range: g.sheet_name + _range, 
            values: val
        });
    });

    return cleanup_data;
}

function get_month_end(income_state_datas){
    return income_state_datas.data[0][1][1]['name'].split(' ')[0];
}

function get_years(income_state_datas){
    var years = [];

    var sample_data_list = income_state_datas.data[0][0];

    sample_data_list.forEach(sample_data => {

        if('headerClass' in sample_data) return;
        
        if(sample_data['name'] == 'TTM'){
            years.push('TTM');
            return;
        }

        var month_year_pair = sample_data['name'].split(' ');

        if(month_year_pair.length != 2) return;
        if(sample_data['value'].includes('<svg')) return;
        
        years.push(parseInt(month_year_pair[1]));
    });

    return years;
}

function get_row_datas(years, data_set, row_idx){
    var row_datas = [];

    if(row_idx.superset == -1 || row_idx.sub_set == -1){
        return row_datas;
    }

    var row_data_list = data_set.data[row_idx.superset][row_idx.subset];

    row_data_list.forEach(row_data => {

        var year = undefined;

        if(row_data['name'] == 'Last Report') row_data['name'] = 'TTM';

        if(row_data['name'] != 'TTM'){
            var month_year_pair = row_data['name'].split(' ');
            if(month_year_pair.length != 2) return;
            year = parseInt(month_year_pair[1]);
        }else{
            year = 'TTM';
        }

        if(years.includes(year) == false) return;

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

function find_row_idx(row_col_str, data_set){

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

module.exports.get_sheet = get_sheet;
module.exports.update_sheet = update_sheet;
module.exports.cleanup_sheet = cleanup_sheet;
module.exports.enum_sheet_types = enum_sheet_types;


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