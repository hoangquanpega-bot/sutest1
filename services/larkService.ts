
import { ITask, IUser, PriorityLevel } from '../types';

// Định nghĩa tên các trường trong Lark Base (Phải khớp chính xác với bảng của bạn)
const FIELD_NAMES = {
  NAME: 'Tên công việc',
  ASSIGNEE: 'Người thực hiện',
  START: 'Thời gian bắt đầu',
  END: 'Thời gian kết thúc',
  COMPLETE: 'Thời gian hoàn thành',
  GROUP: 'Nhóm công việc',
  PRIORITY: 'Mức độ ưu tiên'
};

// Khai báo global bitable từ SDK
declare global {
  interface Window {
    bitable: any;
  }
}

export class LarkService {
  private static instance: LarkService;
  private table: any = null;
  private fieldIdMap: Record<string, string> = {};
  private isInitialized = false;

  private constructor() {}

  public static getInstance(): LarkService {
    if (!LarkService.instance) {
      LarkService.instance = new LarkService();
    }
    return LarkService.instance;
  }

  // --- Initialization & Mapping ---

  private async ensureInit() {
    if (this.isInitialized) return;

    // Kiểm tra xem có đang chạy trong môi trường Lark không
    if (window.bitable) {
      try {
        this.table = await window.bitable.base.getActiveTable();
        const fieldList = await this.table.getFieldList();
        
        // Ánh xạ Tên cột (Tiếng Việt) sang Field ID (fldxxxx)
        for (const key in FIELD_NAMES) {
          const fieldName = FIELD_NAMES[key as keyof typeof FIELD_NAMES];
          const field = fieldList.find((f: any) => f.name === fieldName);
          if (field) {
            this.fieldIdMap[key] = field.id;
          } else {
            console.warn(`Không tìm thấy trường: "${fieldName}". Hãy kiểm tra lại tên cột trong Base.`);
          }
        }
        this.isInitialized = true;
      } catch (e) {
        console.error("Lỗi khởi tạo Lark Base:", e);
      }
    } else {
      console.warn("Không tìm thấy window.bitable. Ứng dụng đang chạy ngoài Lark hoặc SDK chưa load.");
    }
  }

  // --- Read ---

  public async getTasks(): Promise<ITask[]> {
    await this.ensureInit();
    if (!this.table) return this.getMockTasks(); // Fallback to mock if not in Lark

    const recordList = await this.table.getRecordList();
    const records = [];

    for (const record of recordList) {
       records.push(await this.transformRecordToTask(record));
    }

    return records;
  }

  public async getUsers(): Promise<IUser[]> {
    // Trong Lark, danh sách user thường lấy từ field User. 
    // Ở đây ta có thể lấy danh sách tất cả options user nếu cần, 
    // hoặc đơn giản là trả về những user đã được assign.
    // Để đơn giản cho demo, ta sẽ trả về mock users kết hợp với user hiện tại nếu cần.
    return [
      { id: 'u1', name: 'User A', avatarUrl: '' },
      { id: 'u2', name: 'User B', avatarUrl: '' },
      { id: 'u3', name: 'User C', avatarUrl: '' },
    ];
  }

  public async getGroups(): Promise<string[]> {
    await this.ensureInit();
    if (!this.table) return ['Development', 'Design', 'Marketing', 'QA'];

    // Lấy options từ trường Single Select "Nhóm công việc"
    const groupFieldId = this.fieldIdMap['GROUP'];
    if (groupFieldId) {
      const field = await this.table.getField(groupFieldId);
      const options = await field.getOptions();
      return options.map((o: any) => o.name);
    }
    return [];
  }

  // --- Write ---

  public async addTask(task: Omit<ITask, 'id'>): Promise<ITask> {
    await this.ensureInit();
    if (!this.table) return { ...task, id: `mock-${Date.now()}` };

    const fields = await this.transformTaskToFields(task);
    const res = await this.table.addRecord({ fields });
    
    return { ...task, id: res.recordId };
  }

  public async updateTask(id: string, updates: Partial<ITask>): Promise<void> {
    await this.ensureInit();
    if (!this.table) return;

    const fields = await this.transformTaskToFields(updates);
    await this.table.setRecord(id, { fields });
  }

  public async deleteTask(id: string): Promise<void> {
    await this.ensureInit();
    if (!this.table) return;
    await this.table.deleteRecord(id);
  }

  // --- Helpers ---

  private async transformRecordToTask(record: any): Promise<ITask> {
    const fields = record.fields;
    const getValue = (key: string) => fields[this.fieldIdMap[key]];

    // Xử lý User (Lark trả về mảng user objects)
    const assigneeVal = getValue('ASSIGNEE');
    const assignee = assigneeVal && assigneeVal[0] ? {
      id: assigneeVal[0].id,
      name: assigneeVal[0].name,
      avatarUrl: assigneeVal[0].avatar_url
    } : null;

    // Xử lý Priority & Group (Single Select trả về object {text: "High", id: "opt..."})
    // Note: Giá trị raw có thể là object hoặc string tùy loại field, ta lấy text/name
    const priorityVal = getValue('PRIORITY');
    const priority = priorityVal?.text || priorityVal || PriorityLevel.MEDIUM;

    const groupVal = getValue('GROUP');
    const group = groupVal?.text || groupVal || 'General';

    return {
      id: record.recordId,
      name: getValue('NAME') || 'Untitled',
      assignee,
      startDate: getValue('START') || null,
      endDate: getValue('END') || null,
      completedDate: getValue('COMPLETE') || null,
      group: group,
      priority: priority as PriorityLevel
    };
  }

  private async transformTaskToFields(task: Partial<ITask>): Promise<any> {
    const fields: any = {};

    if (task.name !== undefined) fields[this.fieldIdMap['NAME']] = task.name;
    
    if (task.assignee !== undefined) {
      // User field needs array of objects usually, but depends on write format.
      // Often just ID is needed or array of IDs.
      // For simplicity in this demo view, we might not fully implement user search/write 
      // accurately without real user IDs from Lark context.
      // We will skip writing user if it's complex, or implement if we have valid Lark User IDs.
      if (task.assignee) {
        fields[this.fieldIdMap['ASSIGNEE']] = [{ id: task.assignee.id }];
      } else {
         fields[this.fieldIdMap['ASSIGNEE']] = null;
      }
    }

    if (task.startDate !== undefined) fields[this.fieldIdMap['START']] = task.startDate;
    if (task.endDate !== undefined) fields[this.fieldIdMap['END']] = task.endDate;
    if (task.completedDate !== undefined) fields[this.fieldIdMap['COMPLETE']] = task.completedDate;
    
    // Đối với Single Select, tốt nhất là ghi bằng Option ID, nhưng SDK mới có thể hỗ trợ ghi bằng Text (name)
    // Nếu ghi bằng text không hoạt động, cần lookup Option ID trước.
    if (task.group !== undefined) fields[this.fieldIdMap['GROUP']] = task.group;
    if (task.priority !== undefined) fields[this.fieldIdMap['PRIORITY']] = task.priority;

    return fields;
  }

  // --- Mock Fallback ---
  private getMockTasks(): ITask[] {
    return [
      {
        id: 'mock1',
        name: 'Demo Task (Chưa kết nối Lark)',
        assignee: { id: 'u1', name: 'Dev', avatarUrl: '' },
        startDate: Date.now(),
        endDate: Date.now() + 86400000,
        completedDate: null,
        group: 'Development',
        priority: PriorityLevel.HIGH
      }
    ];
  }
}

export const larkService = LarkService.getInstance();
