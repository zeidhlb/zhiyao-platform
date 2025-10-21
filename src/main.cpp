#include <iostream>
#include <vector>
#include <string>
#include "KnowledgeBase.h"
#include "User.h"

void print_welcome() {
    std::cout << "========================================\n";
    std::cout << "    知药 - 智能用药管理与风险预警系统\n";
    std::cout << "             (C++ 命令行版 V0.1)\n";
    std::cout << "========================================\n";
}

void print_menu() {
    std::cout << "\n请选择操作:\n";
    std::cout << "  1. 查看所有可选药品\n";
    std::cout << "  2. 添加用药\n";
    std::cout << "  3. 查看当前用药清单并检测风险\n";
    std::cout << "  4. 移除用药\n";
    std::cout << "  0. 退出\n";
    std::cout << "请输入选项: ";
}

void print_all_drugs(const KnowledgeBase& kb) {
    std::cout << "\n--- 所有可选药品 ---\n";
    for (const auto& pair : kb.get_all_drugs()) {
        std::cout << "ID: " << pair.first << ", 名称: " << pair.second.name << std::endl;
    }
    std::cout << "---------------------\n";
}

void check_risks(const User& user, const KnowledgeBase& kb) {
    std::cout << "\n--- " << user.get_name() << "的当前用药清单 ---\n";
    const auto& medication = user.get_medication();
    if (medication.empty()) {
        std::cout << "暂无用药记录。\n";
    } else {
        for (const auto& drug : medication) {
            std::cout << "- " << drug.name << " (" << drug.id << ")\n";
        }
    }
    
    auto risks = kb.check_interactions(medication);
    std::cout << "\n--- 风险核查结果 ---\n";
    if (risks.empty()) {
        std::cout << "✅ 未发现已知的药物相互作用风险。\n";
    } else {
        for (const auto& risk : risks) {
            if (risk.risk_level == "red") {
                std::cout << "🔴 严重警告! \n";
            } else if (risk.risk_level == "yellow") {
                std::cout << "🟡 注意! \n";
            }
            std::cout << risk.description << std::endl;
        }
    }
    std::cout << "---------------------\n";
}

int main() {
    print_welcome();

    KnowledgeBase kb;
    // 注意：请确保路径正确
    if (!kb.load("data/drugs.json", "data/interactions.json")) {
        std::cerr << "无法加载数据，程序退出。\n";
        return 1;
    }

    User currentUser("张三");
    int choice;

    do {
        print_menu();
        std::cin >> choice;

        switch (choice) {
            case 1:
                print_all_drugs(kb);
                break;
            case 2: {
                std::cout << "请输入要添加的药品ID: ";
                std::string drug_id;
                std::cin >> drug_id;
                Drug drug_to_add = kb.find_drug_by_id(drug_id);
                if (!drug_to_add.id.empty()) {
                    currentUser.add_drug(drug_to_add);
                    std::cout << "已添加: " << drug_to_add.name << std::endl;
                    check_risks(currentUser, kb); // 添加后立即检查
                } else {
                    std::cout << "未找到该药品ID。\n";
                }
                break;
            }
            case 3:
                check_risks(currentUser, kb);
                break;
            case 4: {
                 std::cout << "请输入要移除的药品ID: ";
                std::string drug_id_to_remove;
                std::cin >> drug_id_to_remove;
                currentUser.remove_drug(drug_id_to_remove);
                std::cout << "尝试移除ID为 " << drug_id_to_remove << " 的药品。\n";
                check_risks(currentUser, kb); // 移除后再次检查
                break;
            }
            case 0:
                std::cout << "感谢使用，再见！\n";
                break;
            default:
                std::cout << "无效选项，请重新输入。\n";
                break;
        }
    } while (choice != 0);

    return 0;
}
