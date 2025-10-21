#ifndef USER_H
#define USER_H

#include <string>
#include <set>
#include "Drug.h"

class User {
public:
    User(std::string name) : name(name) {}

    void add_drug(const Drug& drug) {
        current_medication.insert(drug);
    }

    void remove_drug(const std::string& drug_id) {
        for (auto it = current_medication.begin(); it != current_medication.end(); ++it) {
            if (it->id == drug_id) {
                current_medication.erase(it);
                return;
            }
        }
    }

    const std::set<Drug>& get_medication() const {
        return current_medication;
    }

    const std::string& get_name() const {
        return name;
    }

private:
    std::string name;
    std::set<Drug> current_medication;
};

#endif // USER_H
