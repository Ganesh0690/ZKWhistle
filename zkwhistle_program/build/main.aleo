program zkwhistle_kumar_v1.aleo;

struct OrgInfo:
    name_hash as field;
    admin as address;
    member_count as u64;
    report_count as u64;
    is_active as boolean;

struct ReportInfo:
    org_id as field;
    content_hash as field;
    severity as u8;
    block_height as u32;
    status as u8;
    report_index as u64;

mapping organizations:
    key as field.public;
    value as OrgInfo.public;

mapping members:
    key as field.public;
    value as boolean.public;

mapping reports:
    key as field.public;
    value as ReportInfo.public;

mapping org_count:
    key as u8.public;
    value as u64.public;

mapping total_reports:
    key as u8.public;
    value as u64.public;

mapping org_report_index:
    key as field.public;
    value as u64.public;

function register_org:
    input r0 as field.public;
    input r1 as field.public;
    async register_org r0 r1 self.caller into r2;
    output r2 as zkwhistle_kumar_v1.aleo/register_org.future;

finalize register_org:
    input r0 as field.public;
    input r1 as field.public;
    input r2 as address.public;
    contains organizations[r0] into r3;
    not r3 into r4;
    assert.eq r4 true;
    cast r1 r2 0u64 0u64 true into r5 as OrgInfo;
    set r5 into organizations[r0];
    get.or_use org_count[0u8] 0u64 into r6;
    add r6 1u64 into r7;
    set r7 into org_count[0u8];

function add_member:
    input r0 as field.public;
    input r1 as field.public;
    async add_member r0 r1 self.caller into r2;
    output r2 as zkwhistle_kumar_v1.aleo/add_member.future;

finalize add_member:
    input r0 as field.public;
    input r1 as field.public;
    input r2 as address.public;
    get organizations[r0] into r3;
    assert.eq r3.admin r2;
    assert.eq r3.is_active true;
    set true into members[r1];
    add r3.member_count 1u64 into r4;
    cast r3.name_hash r3.admin r4 r3.report_count r3.is_active into r5 as OrgInfo;
    set r5 into organizations[r0];

function submit_report:
    input r0 as field.private;
    input r1 as field.private;
    input r2 as field.public;
    input r3 as field.public;
    input r4 as u8.public;
    hash.bhp256 r1 into r5 as field;
    async submit_report r0 r5 r2 r3 r4 into r6;
    output r6 as zkwhistle_kumar_v1.aleo/submit_report.future;

finalize submit_report:
    input r0 as field.public;
    input r1 as field.public;
    input r2 as field.public;
    input r3 as field.public;
    input r4 as u8.public;
    get members[r1] into r5;
    assert.eq r5 true;
    get organizations[r0] into r6;
    assert.eq r6.is_active true;
    contains reports[r2] into r7;
    not r7 into r8;
    assert.eq r8 true;
    cast r0 r3 r4 0u32 0u8 r6.report_count into r9 as ReportInfo;
    set r9 into reports[r2];
    add r6.report_count 1u64 into r10;
    cast r6.name_hash r6.admin r6.member_count r10 r6.is_active into r11 as OrgInfo;
    set r11 into organizations[r0];
    get.or_use total_reports[0u8] 0u64 into r12;
    add r12 1u64 into r13;
    set r13 into total_reports[0u8];
    set r6.report_count into org_report_index[r2];

function update_report_status:
    input r0 as field.public;
    input r1 as field.public;
    input r2 as u8.public;
    async update_report_status r0 r1 r2 self.caller into r3;
    output r3 as zkwhistle_kumar_v1.aleo/update_report_status.future;

finalize update_report_status:
    input r0 as field.public;
    input r1 as field.public;
    input r2 as u8.public;
    input r3 as address.public;
    get organizations[r0] into r4;
    assert.eq r4.admin r3;
    get reports[r1] into r5;
    assert.eq r5.org_id r0;
    cast r5.org_id r5.content_hash r5.severity r5.block_height r2 r5.report_index into r6 as ReportInfo;
    set r6 into reports[r1];

function compute_member_hash:
    input r0 as field.private;
    hash.bhp256 r0 into r1 as field;
    output r1 as field.public;

constructor:
    assert.eq edition 0u16;
