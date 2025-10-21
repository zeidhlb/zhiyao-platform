#ifndef KNOWLEDGE_BASE_H
#define KNOWLEDGE_BASE_H

#include <iostream>
#include <vector>
#include <string>
#include <fstream>
#include <set>
#include <map>
#include <algorithm>
#include "Drug.h"
#include "nlohmann/json.hpp"

using json = nlohmann::json;

// 风险定义
struct Interaction {
    std::set<std::string> drug_ids;
    std::string risk_level;
    std::string description;
};

class KnowledgeBase {
public:
    // 加载药品和相互作用数据
    bool load(const std::string& drugs_path, const std::string& interactions_path) {
        std::ifstream drugs_file(drugs_path);
        if (!drugs_file.is_open()) {
            std::cerr << "错误: 无法打开药品文件 " << drugs_path << std::endl;
            return false;
        }
        json drugs_json;
        drugs_file >> drugs_json;
        for (const auto& item : drugs_json) {
            all_drugs[item["id"]] = {item["id"], item["name"]};
        }

        std::ifstream interactions_file(interactions_path);
        if (!interactions_file.is_open()) {
            std::cerr << "错误: 无法打开相互作用文件 " << interactions_path << std::endl;
            return false;
        }
        json interactions_json;
        interactions_file >> interactions_json;
        for (const auto& item : interactions_json) {
            Interaction interaction;
            for (const auto& drug_id : item["drugs"]) {
                interaction.drug_ids.insert(drug_id.get<std::string>());
            }
            interaction.risk_level = item["risk_level"];
            interaction.description = item["description"];
            interactions.push_back(interaction);
        }
        return true;
    }

    // 根据 ID 查找药品
    Drug find_drug_by_id(const std::string& id) const {
        auto it = all_drugs.find(id);
        if (it != all_drugs.end()) {
            return it->second;
        }
        return {}; // 返回一个空的 Drug 对象
    }
    
    // 获取所有药品
    const std::map<std::string, Drug>& get_all_drugs() const {
        return all_drugs;
    }

    // 检查一组药物的相互作用
    std::vector<Interaction> check_interactions(const std::set<Drug>& current_drugs) const {
        std::vector<Interaction> found_risks;
        if (current_drugs.size() < 2) {
            return found_risks;
        }

        std::set<std::string> current_drug_ids;
        for (const auto& drug : current_drugs) {
            current_drug_ids.insert(drug.id);
        }

        for (const auto& rule : interactions) {
            // std::includes 需要输入是有序的
            if (std::includes(current_drug_ids.begin(), current_drug_ids.end(),
                              rule.drug_ids.begin(), rule.drug_ids.end())) {
                found_risks.push_back(rule);
            }
        }
        return found_risks;
    }

private:
    std::map<std::string, Drug> all_drugs;
    std::vector<Interaction> interactions;
};

#endif // KNOWLEDGE_BASE_H
